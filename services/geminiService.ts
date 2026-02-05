
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AuditRequest, AuditResponse, PriorityTask, VolumeComparisonResponse } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';
import * as XLSX from 'xlsx';

// @ts-ignore
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Note: We are now using Markdown for all responses instead of JSON where possible
// to ensure a unified and consistent human-readable format.

const volumeComparisonSchema: any = {
  type: "object",
  properties: {
    comparisonTable: {
      type: "array",
      items: {
        type: "object",
        properties: {
          itemName: { type: "string" },
          unit: { type: "string" },
          plannedQty: { type: "number" },
          actualQty: { type: "number" },
          unitPrice: { type: "number" },
          totalPrice: { type: "number" }
        },
        required: ['itemName', 'unit', 'plannedQty', 'actualQty', 'unitPrice', 'totalPrice']
      }
    },
    summary: {
      type: "object",
      properties: {
        totalPlannedCost: { type: "string" },
        totalActualCost: { type: "string" },
        percentComplete: { type: "number" },
        keyDiscrepancies: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ['totalPlannedCost', 'totalActualCost', 'percentComplete', 'keyDiscrepancies']
    }
  },
  required: ['comparisonTable', 'summary']
};

/**
 * Helper to determine if a file is an Excel file based on its name or type
 */
const isExcelFile = (file: File): boolean => {
  const excelMimeTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream'
  ];
  const excelExtensions = ['.xlsx', '.xls', '.csv'];

  return excelMimeTypes.includes(file.type) ||
    excelExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
};

/**
 * Converts an Excel/CSV file to a CSV string
 */
const excelToCsv = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        resolve(csv);
      } catch (err) {
        reject(new Error(`Excel-ը CSV-ի վերածելու սխալ: ${file.name}`));
      }
    };
    reader.onerror = () => reject(new Error(`Ֆայլը կարդալու սխալ: ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Prepares file parts for Gemini API, converting Excel to CSV if needed
 */
const getFilePartsInternal = async (files: File[]) => {
  return Promise.all(
    files.map(async (file) => {
      if (isExcelFile(file)) {
        try {
          const csvContent = await excelToCsv(file);
          return {
            inlineData: {
              data: btoa(unescape(encodeURIComponent(csvContent))),
              mimeType: 'text/csv',
            },
          };
        } catch (err) {
          console.warn(`Failed to convert Excel to CSV, falling back to original mime: ${file.name}`);
        }
      }

      const base64Content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      return {
        inlineData: {
          data: base64Content,
          mimeType: file.type || 'application/pdf',
        },
      };
    })
  );
};

export const performAudit = async (request: AuditRequest, disciplines: PriorityTask[], auditQuestion: string): Promise<AuditResponse> => {
  const model = 'gemini-flash-latest';
  const projectFileParts = await getFilePartsInternal(request.files || []);
  const normFileParts = await getFilePartsInternal(request.normFiles || []);

  const disciplinesText = disciplines
    .filter(d => d.enabled)
    .map(d => `- ${d.label} ուղղությամբ կատարիր ${d.count} հիմնական ստուգում:`)
    .join('\n');

  const questionText = auditQuestion.trim()
    ? `
    **ՀԻՄՆԱԿԱՆ ՀԱՐՑ**: Օգտատերը տվել է հետևյալ կոնկրետ հարցը, որի շուրջ պետք է կառուցվի աուդիտը:
    "${auditQuestion}"
    Խնդրում եմ, աուդիտի արդյունքները ձևավորել՝ առաջին հերթին պատասխանելով այս հարցին՝ հիմնվելով նորմերի վրա։
    `
    : '';

  const prompt = `
    Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես:
    Կցված են երկու տեսակի ֆայլեր:
    1. ՆՈՐՄԱՏԻՎ ՓԱՍՏԱԹՂԹԵՐ: Սրանք այն օրենքներն են, որոնց հիման վրա պետք է կատարվի ստուգումը:
    2. ՆԱԽԱԳԾԱՅԻՆ ՓԱՍՏԱԹՂԹԵՐ: Սա այն նախագիծն է, որը պետք է ստուգվի:

    Նախագծի տվյալները.
    Անվանում: ${request.projectName}
    Կատեգորիա: ${request.category}
    Նկարագրություն: ${request.projectDescription}
    
    ${questionText}
    
    Խնդրում եմ վերլուծել նախագծային ֆայլերը՝ օգտագործելով կցված նորմատիվ փաստաթղթերը որպես առաջնային հիմք:
    
    **ԿԱՐԵՎՈՐ**: Աուդիտը կենտրոնացրու հետևյալ ուղղությունների վրա՝
    ${disciplinesText}
        
    **ԿԱՐԵՎՈՐ ՊԱՀԱՆՋ**: Ինֆորմացիան պետք է լինի բարձր մակարդակով համակարգված, պրոֆեսիոնալ և կառուցվածքային:
    
    Օգտագործիր հետևյալ ԿԱՐԳԱՎՈՐՎԱԾ ձևաչափը.

    Հարգելի՛ գործընկեր, Ձեր ներկայացրած մասնագիտական վերլուծությունը բավականին մանրակրկիտ է և հստակ մատնանշում է նախագծային թերությունները՝ հիմնվելով նորմատիվ բազայի վրա: Ստորև ներկայացնում եմ Ձեր վերլուծության լրամշակված տարբերակը, որն ավելի կառուցվածքային է և ներառում է լրացուցիչ ինժեներական շեշտադրումներ՝ ArchiCheck AI-ի արդյունքներն էլ ավելի հիմնավոր դարձնելու համար:

    ________________________________________
    🏗️ ${request.projectName} նախագծի նորմատիվ համապատասխանության հաշվետվություն

    ## Եզրակացություն
    **Վիճակ՝ [ՀԱՄԱՊԱՏԱՍԽԱՆՈՒՄ Է (SUCCESS) կամ ԽԱԽՏՈՒՄ (VIOLATION)]**
    [Ընդհանուր ամփոփում]
    
    ---

    ## Հայտնաբերված խախտումներ և համապատասխանություն

    ### 1. [Ուղղության Անվանումը]
    **Նկարագրություն.** [Մանրամասն բացատրություն]
    **Նորմ.** [ՀՀՇՆ անվանումը]
    **Կետ.** [Կետը]
    **Կարգավիճակ.** [✅ Համապատասխանում կամ ❌ ԽԱԽՏՈՒՄ]

    ---
    ## Առաջարկություններ
    1. [Առաջարկ 1]
    ---
    ## Նշում
    [Համապարփակ տեխնիկական աուդիտի համար անհրաժեշտ լրացուցիչ փաստաթղթերի ցանկ]

    🏁 Եզրակացություն և Հաջորդ Քայլեր
    [Ամփոփում]

    Ցանկանո՞ւմ եք, որ ես պատրաստեմ պաշտոնական դիտողությունների ձևաթուղթը (checklist), որը կարող եք ուղարկել նախագծող կազմակերպությանը:

    ՄԱՍՆԱԳԻՏԱԿԱՆ ՑՈՒՑՈՒՄՆԵՐ (Professional Output Standards):
    - Բոլոր հաշվարկային թվերը, բանաձևերը և միավորները ներկայացրու **LaTeX** ձևաչափով (օրինակ՝ $3000 \, մ^3/ժ$, $250 \, Պա$, $P_{total} = \sum \Delta P + P_{dyn}$):
    - **ԱՐԳԵԼՎՈՒՄ Է** LaTeX-ի մեջ օգտագործել \`\\text{...}\` կամ \`ext\` գրությունը:
    - Թվերը կլորացրու ՄԻԱՅՆ 2 տասնորդական նիշով:
    - **ԱՐԳԵԼՎՈՒՄ Է** աղյուսակների (tables) օգտագործումը:
    - Յուրաքանչյուր նոր թեմա կամ բաժին սկսիր **նոր տողից**՝ պատշաճ հեռավորությամբ:
    - Պատասխանը պետք է լինի խիստ պրոֆեսիոնալ, կառուցվածքային և ինժեներական՝ ինչպես Gemini կամ ChatGPT համակարգերում:
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [...normFileParts, ...projectFileParts, { text: prompt }] },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
    }
  });

  return response.text || "Արդյունք չկա:";
};

export const performCustomTask = async (request: AuditRequest, task: string): Promise<string> => {
  const model = 'gemini-flash-latest';
  const projectFileParts = await getFilePartsInternal(request.files || []);
  const normFileParts = await getFilePartsInternal(request.normFiles || []);

  const prompt = `
    Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես:
    Օգտատերը ցանկանում է կատարել հետևյալ մասնագիտական առաջադրանքը կամ հարցը.
    
    **ԱՌԱՋԱԴՐԱՆՔ**: ${task}
    
    Վերլուծիր կցված նախագծային ֆայլերը և տուր մանրամասն պատասխան՝ հիմնվելով նորմատիվ փաստաթղթերի վրա: 
    Պատասխանը պետք է լինի հստակ, հայերեն և պրոֆեսիոնալ:
    
    Օգտագործիր հետևյալ ԿԱՐԳԱՎՈՐՎԱԾ ձևաչափը.

    Հարգելի՛ գործընկեր, Ձեր ներկայացրած մասնագիտական հարցումը բավականին մանրակրկիտ է: Ստորև ներկայացնում եմ Ձեր վերլուծության լրամշակված տարբերակը, որն ավելի կառուցվածքային է և ներառում է լրացուցիչ ինժեներական շեշտադրումներ:

    ________________________________________
    🏗️ Մասնագիտական խորհրդատվություն: ${task}

    ## Վերլուծություն և Պատասխան
    [Մանրամասն բացատրություն՝ հիմնված նորմերի և նախագծի վրա]

    ---

    ## Հիմնական Կետեր
    ### 1. [Թեմայի Անվանումը]
    **Նկարագրություն.** [Բացատրություն]
    **Նորմ.** [ՀՀՇՆ անվանումը]
    **Կետ.** [Կետը]
    **Կարգավիճակ.** [✅ Համապատասխանում կամ ❌ ԽԱԽՏՈՒՄ]

    ---

    🏁 Եզրակացություն և Հաջորդ Քայլեր
    [Ամփոփում]

    ՄԱՍՆԱԳԻՏԱԿԱՆ ՑՈՒՑՈՒՄՆԵՐ (Professional Output Standards):
    - Բոլոր հաշվարկային թվերը, բանաձևերը և միավորները ներկայացրու **LaTeX** ձևաչափով (օրինակ՝ $3000 \, մ^3/ժ$, $P_{total} = \sum \Delta P + P_{dyn}$):
    - **ԱՐԳԵԼՎՈՒՄ Է** LaTeX-ի մեջ օգտագործել \`\\text{...}\` կամ \`ext\` գրությունը:
    - Կետերը սկսիր ԲՈԼԴ վերնագրով՝ առանց բուլետների։
    - Բոլոր թվերը կլորացրու մինչև 2 տասնորդական նիշ:
    - **ԱՐԳԵԼՎՈՒՄ Է** աղյուսակների օգտագործումը:
    - Ապահովիր ինֆորմացիայի բարձրորակ մատուցում և դասավորվածություն:
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [...normFileParts, ...projectFileParts, { text: prompt }] },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
    }
  });

  return response.text || "Արդյունք չկա:";
};

export const performPriorityAudit = async (request: AuditRequest, tasks: PriorityTask[], priorityQuestion: string): Promise<string> => {
  const model = 'gemini-flash-latest';
  const projectFileParts = await getFilePartsInternal(request.files || []);
  const normFileParts = await getFilePartsInternal(request.normFiles || []);

  const activeTasks = tasks.filter(t => t.enabled);
  if (activeTasks.length === 0) throw new Error("Խնդրում ենք ընտրել առնվազն մեկ ուղղություն:");

  const tasksDescription = activeTasks.map(t => `- ${t.label} ուղղությամբ գտիր ${t.count} խնդիր:`).join("\n");

  const questionText = priorityQuestion.trim()
    ? `
**ՀԱՐՑԱԴՐՈՒՄ**: Օգտատերը տվել է հետևյալ կոնկրետ հարցը.
"${priorityQuestion}"
`
    : '';

  const prompt = `
    Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես:
    Քո առաջադրանքն է՝ հիմնվելով ներբեռնված նախագծի և նորմատիվ բազայի վրա, առանձնացնել կոնկրետ խնդիրներ:
    
    ${questionText}

    Գտիր խնդիրներ հետևյալ ուղղություններով և քանակներով.
    ${tasksDescription}
    
    Օգտագործիր հետևյալ ԿԱՐԳԱՎՈՐՎԱԾ ձևաչափը.

    Հարգելի՛ գործընկեր, Ձեր ներկայացրած մասնագիտական վերլուծությունը բավականին մանրակրկիտ է և հստակ մատնանշում է նախագծային թերությունները: Ստորև ներկայացնում եմ Ձեր վերլուծության լրամշակված տարբերակը, որն ավելի կառուցվածքային է և ներառում է լրացուցիչ ինժեներական շեշտադրումներ:

    ________________________________________
    🏗️ Մասնագիտացված Խնդիրների Որոնման Զեկույց

    ## Եզրակացություն
    [Ամփոփում հայտնաբերված հիմնական ռիսկերի վերաբերյալ]

    ---

    ## Մանրամասն Վերլուծություն ըստ Ուղղությունների

    ### [Ուղղության Անվանումը]
    **Կարևոր դիտարկում.** [Ընդհանուր նկարագրություն]

    **Խնդիր.** [Նկարագրություն]
    **Լուծում.** [Առաջարկ]
    **Հղում.** [Նորմ]

    ---

    🏁 Եզրակացություն և Հաջորդ Քայլեր
    [Ամփոփում]

    ՄԱՍՆԱԳԻՏԱԿԱՆ ՑՈՒՑՈՒՄՆԵՐ (Professional Output Standards):
    - Բոլոր հաշվարկային թվերը, բանաձևերը և միավորները ներկայացրու **LaTeX** ձևաչափով (օրինակ՝ $3000 \, մ^3/ժ$, $250 \, Պա$, $P_{total} = \sum \Delta P + P_{dyn}$):
    - **ԱՐԳԵԼՎՈՒՄ Է** LaTeX-ի մեջ օգտագործել \`\\text{...}\` կամ \`ext\` գրությունը:
    - **ԱՐԳԵԼՎՈՒՄ Է** աղյուսակների (tables) օգտագործումը: Ինֆորմացիան ներկացրու տեքստի տեսքով:
    - **ԱՐԳԵԼՎՈՒՄ Է** պուտիկների (bullets, *, -) օգտագործումը տեխնիկական պիտակներից առաջ (Խնդիր, Լուծում, Հղում)։
    - Յուրաքանչյուր նոր թեմա, ենթաթեմա կամ բաժին պետք է սկսվի **նոր տողից**։
    - Բոլոր թվերը կլորացրու մինչև 2 տասնորդական նիշ:
    - Ապահովիր պատշաճ դասավորվածություն և որակյալ մատուցում:
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [...normFileParts, ...projectFileParts, { text: prompt }] },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
    }
  });

  return response.text || "Արդյունք չկա:";
};

export const performLayoutAudit = async (request: AuditRequest, question: string): Promise<string> => {
  const model = 'gemini-flash-latest';
  const projectFileParts = await getFilePartsInternal(request.files || []);

  const prompt = `
    Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես մասնագիտացված հատակագծերի և տարածական լուծումների մեջ:
    Վերլուծիր կցված հատակագծերը և պատասխանիր հետևյալ հարցին.
    
    **ՀԱՐՑ**: ${question || "Վերլուծիր այս հատակագիծը և նշիր հնարավոր խնդիրները կամ առաջարկները:"}
    
    Տուր մանրամասն, պրոֆեսիոնալ պատասխան հայերենով:
    
    Օգտագործիր հետևյալ ԿԱՐԳԱՎՈՐՎԱԾ ձևաչափը.

    Հարգելի՛ գործընկեր, Ձեր ներկայացրած գրաֆիկական վերլուծության հարցումը բավականին մանրակրկիտ է: Ստորև ներկայացնում եմ լրամշակված տարբերակը:

    ________________________________________
    🏗️ Գրաֆիկական Վերլուծության Զեկույց

    ## Հատակագծային Լուծումների Ամփոփում
    [Տեսողական վերլուծության արդյունքների ամփոփում]

    ---

    ## Հայտնաբերված Տարածական Խնդիրներ

    ### [Խնդրահարույց Գոտի/Հատված]
    **Նկարագրություն.** [Ինչ է հայտնաբերվել գծագրերում]
    **Կարգավիճակ.** [✅/❌]
    **Առաջարկ.** [Ինչպես շտկել]

    ---

    🏁 Եզրակացություն և Հաջորդ Քայլեր
    [Ամփոփում]

    ՄԱՍՆԱԳԻՏԱԿԱՆ ՑՈՒՑՈՒՄՆԵՐ (Professional Output Standards):
    - Բոլոր հաշվարկային թվերը, բանաձևերը և միավորները ներկայացրու **LaTeX** ձևաչափով (օրինակ՝ $3000 \, մ^3/ժ$):
    - **ԱՐԳԵԼՎՈՒՄ Է** LaTeX-ի մեջ օգտագործել \`\\text{...}\` կամ \`ext\` գրությունը:
    - **ԱՐԳԵԼՎՈՒՄ Է** աղյուսակների օգտագործումը:
    - Կետերը սկսիր ԲՈԼԴ վերնագրով՝ առանց բուլետների։
    - Բոլոր թվերը կլորացրու մինչև 2 տասնորդական նիշ:
    - Յուրաքանչյուր նոր թեմա սկսիր նոր տողից՝ ապահովելով ChatGPT-ին բնորոշ որակյալ դասավորվածություն:
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [...projectFileParts, { text: prompt }] },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
    }
  });

  return response.text || "Արդյունք չկա:";
};

export const performVolumeComparison = async (estimateFile: File, asBuiltFile: File): Promise<VolumeComparisonResponse> => {
  const model = 'gemini-flash-latest';
  const estimateFileParts = await getFilePartsInternal([estimateFile]);
  const asBuiltFileParts = await getFilePartsInternal([asBuiltFile]);

  const prompt = `
    Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես:
    Քո առաջադրանքն է՝ համեմատել նախահաշվային ծավալները փաստացի կատարողական ծավալների հետ:
    
    1. Վերլուծիր ներբեռնված երկու ֆայլերը:
    2. Ստեղծիր համեմատության աղյուսակ բոլոր աշխատանքների համար:
    3. Քաղիր կամ հաշվարկիր միավորի գինը (unitPrice) և ընդհանուր գումարը (totalPrice) յուրաքանչյուր կետի համար։
    4. Հաշվիր ընդհանուր նախահաշվային և փաստացի ծախսերը:
    5. Առանձնացրու հիմնական շեղումները:
    
    Վերադարձրու արդյունքը JSON ձևաչափով՝ համաձայն տրված սխեմայի:
    
    **ԾԱՅՐԱՀԵՂ ԿԱՐԵՎՈՐ ՑՈՒՑՈՒՄՆԵՐ**:
    - **ԱՐԳԵԼՎՈՒՄ Է** LaTeX-ի ($) օգտագործումը չափման միավորների համար:
    - Դրամը նշիր սովորական տեքստով (օրինակ՝ 1,500,000 դրամ):
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: "ՆԱԽԱՀԱՇԻՎ (ESTIMATE):" },
        ...estimateFileParts,
        { text: "ԿԱՏԱՐՈՂԱԿԱՆ (AS-BUILT):" },
        ...asBuiltFileParts,
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: "Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես: Պատասխանիր JSON ձևաչափով: Խստորեն պահպանիր չափման միավորները սովորական տեքստով գրելու կանոնը:",
      responseMimeType: "application/json",
      responseSchema: volumeComparisonSchema,
      temperature: 0.1,
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("Մոդելը պատասխան չտվեց:");
  return JSON.parse(jsonText) as VolumeComparisonResponse;
};

// Audio response generation removed as requested
