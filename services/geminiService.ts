
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
          actualQty: { type: "number" }
        },
        required: ['itemName', 'unit', 'plannedQty', 'actualQty']
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
    ՈՒՇԱԴՐՈՒԹՅՈՒՆ. Կցված են երկու տեսակի ֆայլեր:
    1. ՆՈՐՄԱՏԻՎ ՓԱՍՏԱԹՂԹԵՐ: Սրանք այն օրենքներն են, որոնց հիման վրա պետք է կատարվի ստուգումը:
    2. ՆԱԽԱԳԾԱՅԻՆ ՓԱՍՏԱԹՂԹԵՐ: Սա այն նախագիծն է, որը պետք է ստուգվի:

    Նախագծի տվյալները.
    Անվանում: ${request.projectName}
    Կատեգորիա: ${request.category}
    Նկարագրություն: ${request.projectDescription}
    
    ${questionText}
    
    Խնդրում եմ վերլուծել նախագծային ֆայլերը՝ օգտագործելով կցված նորմատիվ փաստաթղթերը որպես առաջնային հիմք:
    
    **ԿԱՐԵՎՈՐ**: Աուդիտը կենտրոնացրու հետևյալ ուղղությունների վրա՝ կատարելով նշված քանակի հիմնական ստուգումներ յուրաքանչյուրի համար: Եթե տրված է հիմնական հարց, ապա այս ուղղությունները դիտարկիր որպես երկրորդական՝ հարցին պատասխանելուց հետո։
    ${disciplinesText}
        
    **ԿԱՐԵՎՈՐ ՊԱՀԱՆՋ**: Ինֆորմացիան պետք է լինի բարձր մակարդակով համակարգված և պրոֆեսիոնալ:
    ԱՐԳԵԼՎՈՒՄ Է ՕԳՏԱԳՈՐԾԵԼ ԱՂՅՈՒՍԱԿՆԵՐ (|---|)։ Ինֆորմացիան տեղադրիր իրար տակ (vertical point-by-point arrangement)։
    
    Օգտագործիր հետևյալ ԿԱՐԳԱՎՈՐՎԱԾ ձևաչափը.

    # ${request.projectName} նախագծի նորմատիվ համապատասխանության հաշվետվություն

    ## Եզրակացություն
    **Վիճակ՝ [ՀԱՄԱՊԱՏԱՍԽԱՆՈՒՄ Է (SUCCESS) կամ ԽԱԽՏՈՒՄ (VIOLATION)]**
    [Ընդհանուր ամփոփում]
    
    Բացակայող տարրեր (եթե կան)՝
    * [Կետ 1]
    * [Կետ 2]

    ---

    ## Հայտնաբերված խախտումներ և համապատասխանություն

    ### 1. [Ուղղության Անվանումը]
    * **Նորմ**: [ՀՀՇՆ անվանումը]
    * **Կետ**: [Կետը]
    * **Կարգավիճակ**: [✅ Համապատասխանում (MATCH) կամ ❌ ԽԱԽՏՈՒՄ (VIOLATION)]
    * **Նկարագրություն**: [Մանրամասն բացատրություն]

    ---

    ## Առաջարկություններ
    1. [Առաջարկ 1]
    2. [Առաջարկ 2]

    ---

    ## Նշում
    [Համապարփակ տեխնիկական աուդիտի համար անհրաժեշտ լրացուցիչ փաստաթղթերի ցանկ]

    **ԾԱՅՐԱՀԵՂ ԿԱՐԵՎՈՐ (Textbook Style)**:
    - **Աղյուսակներ** (|---|) օգտագործիր ՄԻԱՅՆ տեխնիկական պարամետրերի կամ թվային տվյալների համար:
    - Աղյուսակը պետք է ունենա մաքուր Markdown ձևաչափ (օրինակ՝ | Սյունակ 1 | Սյունակ 2 |):
    - **ԽՍՏԻՎ ԱՐԳԵԼՎՈՒՄ Է** կրկնակի ուղղահայաց գծերի օգտագործումը (| |) սկզբում կամ վերջում:
    - Չափման միավորների համար **ԱՐԳԵԼՎՈՒՄ Է** LaTeX ($) նշանի կամ backslash (\\) օգտագործումը: Գրիր միայն սովորական տեքստով (մ³, կՎտ):
    - Բաժինների միջև դիր հորիզոնական գիծ (---):
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

    # մասնագիտական խորհրդատվություն: ${task}

    ## Վերլուծություն և Պատասխան
    [Մանրամասն բացատրություն՝ հիմնված նորմերի և նախագծի վրա]

    ---

    ## Հիմնական Կետեր
    ### 1. [Թեմայի Անվանումը]
    * **Նորմ**: [ՀՀՇՆ անվանումը]
    * **Կետ**: [Կետը]
    * **Կարգավիճակ**: [✅ Համապատասխանում (MATCH) կամ ❌ ԽԱԽՏՈՒՄ (VIOLATION)]
    * **Նկարագրություն**: [Բացատրություն]

    ---

    ## Առաջարկություններ / Եզրակացություն
    1. [Կետ 1]
    2. [Կետ 2]

    **ԾԱՅՐԱՀԵՂ ԿԱՐԵՎՈՐ ՑՈՒՑՈՒՄՆԵՐ ԳՐՔԱՅԻՆ ՏԵՍՔԻ ՀԱՄԱՐ**:
    - **Աղյուսակներ** (|---|) օգտագործիր ՄԻԱՅՆ տեխնիկական պարամետրերի համար:
    - Աղյուսակը պետք է ունենա մաքուր Markdown ձևաչափ (առանց կրկնակի | | նշանների):
    - Չափման միավորների համար **ԱՐԳԵԼՎՈՒՄ Է** LaTeX ($) կամ \\ նշանների օգտագործումը:
    - Բոլոր թվերը կլորացրու մինչև 2 տասնորդական նիշ:
    - Պատասխանը պետք է լինի պատմողական (narrative style):
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [...normFileParts, ...projectFileParts, { text: prompt }] },
    config: {
      systemInstruction: "Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես, մասնագիտացված բազմապրոֆիլ ճարտարագիտական ռիսկերի գնահատման մեջ: Պատասխանիր հայերեն, Markdown ձևաչափով: Խստորեն հետևիր չափման միավորները սովորական տեքստով գրելու կանոնին:",
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

    # Մասնագիտացված Խնդիրների Որոնման Զեկույց

    ## Եզրակացություն
    [Ամփոփում հայտնաբերված հիմնական ռիսկերի վերաբերյալ]

    ---

    ## Մանրամասն Վերլուծություն ըստ Ուղղությունների

    ### [Ուղղության Անվանումը]
    * **Խնդիր №1. [Վերնագիր]**
    * **Նորմ**: [ՀՀՇՆ անվանումը]
    * **Կետ**: [Կետը]
    * **Կարգավիճակ**: ❌ ԽԱԽՏՈՒՄ (VIOLATION)
    * **Նկարագրություն**: [Մանրամասն բացատրություն]

    ---

    ## Լուծման Առաջարկներ
    1. [Այն քայլերը, որոնք պետք է ձեռնարկվեն]

    **ԾԱՅՐԱՀԵՂ ԿԱՐԵՎՈՐ (Textbook Style)**:
    - **Աղյուսակներ** (|---|) օգտագործիր ՄԻԱՅՆ տեխնիկական պարամետրերի համար:
    - **ԽՍՏԻՎ ԱՐԳԵԼՎՈՒՄ Է** LaTeX ($) կամ \\ նշանների օգտագործումը:
    - Ինֆորմացիան ներկայացրու ուղղահայաց (vertical) կառուցվածքով:
    - Բաժինների միջև դիր հորիզոնական գիծ (---):
    - Չափման միավորները գրիր հայերեն տեքստով (օրինակ՝ մ³):
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [...normFileParts, ...projectFileParts, { text: prompt }] },
    config: {
      systemInstruction: "Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես: Պատասխանիր բացառապես Markdown-ով: ԽՍՏԻՎ ԱՐԳԵԼՎՈՒՄ Է աղյուսակների (|---|) օգտագործումը: Ինֆորմացիան ներկայացրու ուղղահայաց (vertical) կառուցվածքով, որտեղ յուրաքանչյուր կետը գտնվում է նոր տողում: Պարտադիր օգտագործիր բուլետներ (*) և թավ (bold) տեքստ:",
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

    # Գրաֆիկական Վերլուծության Զեկույց

    ## Հատակագծային Լուծումների Ամփոփում
    [Տեսողական վերլուծության արդյունքների ամփոփում]

    ---

    ## Հայտնաբերված Տարածական Խնդիրներ

    ### [Խնդրահարույց Գոտի/Հատված]
    * **Խնդիր**: [Վերնագիր]
    * **Կարգավիճակ**: [✅/❌]
    * **Նկարագրություն**: [Ինչ է հայտնաբերվել գծագրերում]
    * **Առաջարկ**: [Ինչպես շտկել]

    ---

    ## Առաջարկություններ
    1. [Կետ 1]

    **ԾԱՅՐԱՀԵՂ ԿԱՐԵՎՈՐ ՑՈՒՑՈՒՄՆԵՐ ԳՐՔԱՅԻՆ ՏԵՍՔԻ ՀԱՄԱՐ**:
    - **Աղյուսակներ** (|---|) օգտագործիր ՄԻԱՅՆ տեխնիկական պարամետրերի համար:
    - **ԱՐԳԵԼՎՈՒՄ Է** LaTeX ($) կամ \\ նշանների օգտագործումը:
    - Չափման միավորները գրիր հայերեն տեքստով (լ/վ, կՎտ):
    - Բաժինների միջև դիր հորիզոնական գիծ (---):
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [...projectFileParts, { text: prompt }] },
    config: {
      systemInstruction: "Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես հատակագծերի վերլուծության մեջ: Պատասխանիր հայերեն, Markdown ձևաչափով: Խստորեն հետևիր չափման միավորները սովորական տեքստով գրելու կանոնին:",
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
    3. Հաշվիր ընդհանուր նախահաշվային և փաստացի ծախսերը:
    4. Առանձնացրու հիմնական շեղումները:
    
    Վերադարձրու արդյունքը JSON ձևաչափով՝ համաձայն տրված սխեմայի:
    
    **ԾԱՅՐԱՀԵՂ ԿԱՐԵՎՈՐ ՑՈՒՑՈՒՄՆԵՐ**:
    - **ԱՐԳԵԼՎՈՒՄ Է**LaTeX-ի ($) օգտագործումը չափման միավորների համար:
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

export const generateAudioResponse = async (text: string): Promise<Blob> => {
  throw new Error("Աուդիո գեներացման ֆունկցիան ժամանակավորապես անհասանելի է:");
};
