
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { AuditRequest, AuditResponse, PriorityTask, VolumeComparisonResponse } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

const auditResponseSchema = {
  type: Type.OBJECT,
  properties: {
    conclusion: { type: Type.STRING, description: 'SUCCESS or VIOLATION' },
    summary: { type: Type.STRING },
    details: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          norm: { type: Type.STRING },
          clause: { type: Type.STRING },
          status: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ['norm', 'clause', 'status', 'description']
      }
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ['conclusion', 'summary', 'details', 'recommendations']
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const getFileParts = async (files: File[]) => {
  const parts = [];
  for (const file of files) {
    const base64Data = await fileToBase64(file);
    parts.push({ inlineData: { data: base64Data, mimeType: file.type } });
  }
  return parts;
};

export const performAudit = async (request: AuditRequest, disciplines: PriorityTask[], auditQuestion: string): Promise<AuditResponse> => {
  const model = 'gemini-flash-latest';
  const projectFileParts = await getFileParts(request.files);
  const normFileParts = await getFileParts(request.normFiles);

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
        
    Յուրաքանչյուր ստուգման արդյունքը (թե՛ համապատասխանություն, թե՛ խախտում) ներկայացրու "details" զանգվածում։ Եթե խախտում չկա նշված ուղղությամբ, կարող ես վերադարձնել միայն համապատասխանության կետեր:
    
    Տվեք վերջնական եզրակացություն JSON ձևաչափով:
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [...normFileParts, ...projectFileParts, { text: prompt }] },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: auditResponseSchema,
      temperature: 0.1,

    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("Մոդելը պատասխան չտվեց:");
  return JSON.parse(jsonText) as AuditResponse;
};

export const performCustomTask = async (request: AuditRequest, userTask: string): Promise<string> => {
  const model = 'gemini-flash-latest';
  const projectFileParts = await getFileParts(request.files);
  const normFileParts = await getFileParts(request.normFiles);

  const prompt = `
    Դու ArchiCheck AI համակարգի գլխավոր փորձագետ-խորհրդատուն ես: Պատասխանիր հարցին մասնագիտական զեկույցի տեսքով:
    
    ԱՌԱՋԱԴՐԱՆՔ: "${userTask}"
    
    **ԾԱՅՐԱՀԵՂ ԿԱՐԵՎՈՐ ՑՈՒՑՈՒՄՆԵՐ ԳՐՔԱՅԻՆ ՏԵՍՔԻ ՀԱՄԱՐ**:
    - **ԱՐԳԵԼՎՈՒՄ Է** օգտագործել LaTeX ($) հասարակ չափման միավորների համար (օրինակ՝ **մ³, մ², ժ, անձ**):
    - Չափման միավորները գրիր ՄԻԱՅՆ սովորական տեքստով (օրինակ՝ **1.8 մ**, **109 մ²**, **60 մ³/ժ**, **8 անձ**):
    - **LaTeX-ը** ($$, $) օգտագործիր միայն բարդ բանաձևերի և մաթեմատիկական հաշվարկների համար:
    - Պատասխանը ձևավորիր որպես պրոֆեսիոնալ ու պարզ դասագիրք (school-book style):
    - Հաշվարկները կատարիր քայլ առ քայլ: Յուրաքանչյուր քայլից հետո բացատրիր արդյունքը պարզ հայերենով:

    ԶԵԿՈՒՅՑԻ ԿԱՌՈՒՑՎԱԾՔԸ.
    1. **Նախաբան**: Ի՞նչ ենք վերլուծում:
    2. **Մանրամասն Վերլուծություն**: Օգտագործիր վերնագրեր և կետեր:
    3. **Հաշվարկներ**: Ներկայացրու LaTeX բանաձևերով, քայլ առ քայլ:
    4. **Հղումներ Նորմերին**: Նշիր կոնկրետ կետեր:
    5. **Եզրակացություն**: Կարճ և հստակ:

    Նախագծի համատեքստը: ${request.projectName} (${request.category})
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [...normFileParts, ...projectFileParts, { text: prompt }] },
    config: {
      systemInstruction: "Դու ArchiCheck AI համակարգի գլխավոր փորձագետ-խորհրդատուն ես: Պատասխանիր բացառապես Markdown ձևաչափով՝ օգտագործելով LaTeX բանաձևեր ՄԻԱՅՆ բարդ հաշվարկների համար: Չափման միավորները գրիր սովորական տեքստով (մ², մ³, մ):",
      temperature: 0.2,

    }
  });

  return response.text || "Պատասխան հնարավոր չեղավ ստանալ:";
};

export const performPriorityAudit = async (request: AuditRequest, tasks: PriorityTask[], priorityQuestion: string): Promise<string> => {
  const model = 'gemini-flash-latest';
  const projectFileParts = await getFileParts(request.files);
  const normFileParts = await getFileParts(request.normFiles);

  const activeTasks = tasks.filter(t => t.enabled);
  if (activeTasks.length === 0) throw new Error("Խնդրում ենք ընտրել առնվազն մեկ ուղղություն:");

  const tasksDescription = activeTasks.map(t => `- ${t.label} ուղղությամբ գտիր ${t.count} խնդիր:`).join("\n");

  const questionText = priorityQuestion.trim()
    ? `
**ՀԻՄՆԱԿԱՆ ՀԱՐՑ**: Օգտատերը տվել է հետևյալ կոնկրետ հարցը: Խնդիրների որոնումը պետք է կենտրոնացնել այս հարցի շուրջ:
"${priorityQuestion}"
`
    : '';

  const prompt = `
    Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես:
    Քո առաջադրանքն է՝ հիմնվելով ներբեռնված նախագծի և նորմատիվ բազայի վրա, առանձնացնել կոնկրետ խնդիրներ:
    
    ${questionText}

    Գտիր խնդիրներ հետևյալ ուղղություններով և քանակներով. Եթե տրված է հիմնական հարց, ապա խնդիրները պետք է վերաբերեն այդ հարցին։
    
    ${tasksDescription}
    
    **ԿԱՐԵՎՈՐ ՑՈՒՑՈՒՄ**: Աղյուսակները պետք է լինեն պրոֆեսիոնալ և հստակ: 
    Յուրաքանչյուր ուղղության համար կիրառիր հետևյալ աղյուսակային ձևաչափը.

    ### [Ուղղության Անվանումը]
    | № | Խնդրի նկարագրություն | Նորմատիվ հղում | Լուծման առաջարկ |
    |---|:---|:---|:---|
    | 1 | ... | ... | ... |

    **ԾԱՅՐԱՀԵՂ ԿԱՐԵՎՈՐ ՑՈՒՑՈՒՄՆԵՐ ԳՐՔԱՅԻՆ ՏԵՍՔԻ ՀԱՄԱՐ**:
    - **ԱՐԳԵԼՎՈՒՄ Է** օգտագործել LaTeX ($) հասարակ չափման միավորների համար (օրինակ՝ **մ³, մ², ժ, անձ**):
    - Չափման միավորները գրիր ՄԻԱՅՆ սովորական տեքստով (օրինակ՝ **1.8 մ**, **109 մ²**, **60 մ³/ժ**, **8 անձ**):
    - **LaTeX-ը** ($$, $) օգտագործիր միայն բարդ բանաձևերի և մաթեմատիկական հաշվարկների համար:
    - Պատասխանը ձևավորիր որպես պրոֆեսիոնալ ու պարզ դասագիրք (school-book style):
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [...normFileParts, ...projectFileParts, { text: prompt }] },
    config: {
      systemInstruction: "Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես, մասնագիտացված բազմապրոֆիլ ճարտարագիտական ռիսկերի գնահատման մեջ: Պատասխանիր հայերեն, Markdown ձևաչափով: Պարտադիր օգտագործիր աղյուսակներ խնդիրները ներկայացնելիս: Խստորեն հետևիր չափման միավորները սովորական տեքստով գրելու կանոնին:",
      temperature: 0.1,
    }
  });

  return response.text || "Արդյունք չկա:";
};

export const performLayoutAudit = async (request: AuditRequest, layoutQuestion: string): Promise<string> => {
  const model = 'gemini-flash-latest';
  const projectFileParts = await getFileParts(request.files);
  const normFileParts = await getFileParts(request.normFiles);

  const questionText = layoutQuestion.trim()
    ? `
**ՀԻՄՆԱԿԱՆ ՀԱՐՑ**: Օգտատերը տվել է հետևյալ կոնկրետ հարցը: Խնդրում եմ, հատակագծերի վերլուծությունը կենտրոնացնել այս հարցի պատասխանի շուրջ:
"${layoutQuestion}"
`
    : '';

  const prompt = `
    Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես:
    Քո առաջադրանքն է՝ ըստ ներբեռնված հատակագծերի (layouts), նշել կոնկրետ հատվածներում առկա անհամապատասխանությունները և տալ լուծման ձևը:
    
    ${questionText}
    
    Օրինակ՝ «1-ին հարկի հատակագիծ, մուտքի մաս. աստիճանների թեքությունը չի համապատասխանում ՀՀՇՆ-ին: Լուծում՝ ավելացնել թեքահարթակ 1:12 հարաբերակցությամբ»:
    
    Խնդրում եմ վերլուծել բոլոր գրաֆիկական ֆայլերը և տալ կոնկրետ տեղային (localized) հրահանգներ:
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [...normFileParts, ...projectFileParts, { text: prompt }] },
    config: {
      systemInstruction: "Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես, փորձառու նախագծող-ճարտարագետ: Պատասխանիր Markdown ձևաչափով, օգտագործելով կետային նկարագրություններ: Պատասխանը ձևավորիր որպես պրոֆեսիոնալ ու պարզ դասագիրք (school-book style): Չափման միավորները (մ, մ², մ³) գրիր սովորական տեքստով:",
      temperature: 0.1,
    }
  });

  return response.text || "Արդյունք չկա:";
};


export const performVolumeComparison = async (estimateFile: File, asBuiltFile: File): Promise<VolumeComparisonResponse> => {
  const model = 'gemini-flash-latest';
  const estimateFilePart = { inlineData: { data: await fileToBase64(estimateFile), mimeType: estimateFile.type } };
  const asBuiltFilePart = { inlineData: { data: await fileToBase64(asBuiltFile), mimeType: asBuiltFile.type } };

  const volumeComparisonSchema = {
    type: Type.OBJECT,
    properties: {
      comparisonTable: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING },
            unit: { type: Type.STRING },
            plannedQty: { type: Type.NUMBER },
            actualQty: { type: Type.NUMBER },
          },
          required: ['itemName', 'unit', 'plannedQty', 'actualQty'],
        },
      },
      summary: {
        type: Type.OBJECT,
        properties: {
          totalPlannedCost: { type: Type.STRING },
          totalActualCost: { type: Type.STRING },
          percentComplete: { type: Type.NUMBER },
          keyDiscrepancies: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['totalPlannedCost', 'totalActualCost', 'percentComplete', 'keyDiscrepancies'],
      },
    },
    required: ['comparisonTable', 'summary'],
  };

  const prompt = `
    Դու բարձրակարգ ինժեներ-նախահաշվորդ ես։ Քեզ տրամադրվել է երկու ֆայլ՝
    1.  **Նախահաշիվ (Estimate)**: Պարունակում է պլանավորված աշխատանքների ծավալները և գները։
    2.  **Կատարողական (As-built)**: Պարունակում է փաստացի կատարված աշխատանքների ծավալները։

    **Առաջադրանք:**
    1.  **Վերլուծիր** երկու ֆայլերը։ Դրանք կարող են լինել PDF կամ Excel ֆորմատով։
    2.  **Համեմատիր** դրանք տող առ տող։ Խելացիորեն **համապատասխանեցրու** աշխատանքի տեսակները, նույնիսկ եթե դրանց անվանումները մի փոքր տարբերվում են։
    3.  Յուրաքանչյուր համապատասխանեցված կամ չհամապատասխանեցված տողի համար **առանձնացրու**՝ «Աշխատանքի անվանում», «Չափի միավոր», «Նախահաշվային քանակ», «Փաստացի քանակ»։
    4.  Եթե մի տեսակ կա մի ֆայլում, բայց բացակայում է մյուսում, միևնույն է, ներառիր այն աղյուսակում՝ բացակայող քանակը նշելով 0։
    5.  **Հաշվարկիր** ամփոփ տվյալները՝ ընդհանուր նախահաշվային և փաստացի արժեքները (եթե գները նշված են), ավարտվածության տոկոսը և առանձնացրու ամենակարևոր 3-5 շեղումները։
    6.  **Վերադարձրու** արդյունքը որպես մեկ ամբողջական JSON օբյեկտ՝ ստորև նշված կառուցվածքով։ Թվային դաշտերը պետք է լինեն թվեր, ոչ թե տեքստ։

    Պատասխանը պետք է լինի բացառապես JSON ձևաչափով՝ համաձայն տրված սխեմայի։
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      { parts: [estimateFilePart, { text: "Սա Նախահաշիվ ֆայլն է։" }] },
      { parts: [asBuiltFilePart, { text: "Սա Կատարողական ֆայլն է։" }] },
      { parts: [{ text: prompt }] }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: volumeComparisonSchema,
      temperature: 0.0,

    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("Մոդելը պատասխան չտվեց:");
  return JSON.parse(jsonText) as VolumeComparisonResponse;
};


/**
 * Text-to-Speech related functions
 */

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createWavHeader(dataLength: number, sampleRate: number): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  /* RIFF identifier */
  view.setUint32(0, 0x52494646, false); // "RIFF"
  /* file length */
  view.setUint32(4, 36 + dataLength, true);
  /* RIFF type */
  view.setUint32(8, 0x57415645, false); // "WAVE"
  /* format chunk identifier */
  view.setUint32(12, 0x666d7420, false); // "fmt "
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (PCM) */
  view.setUint16(20, 1, true);
  /* channel count (Mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  view.setUint32(36, 0x64617461, false); // "data"
  /* data chunk length */
  view.setUint32(40, dataLength, true);
  return new Uint8Array(header);
}

export const generateAudioResponse = async (text: string): Promise<Blob> => {
  const model = 'gemini-2.5-flash-preview-tts';
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: `Կարդա հետևյալ մասնագիտական զեկույցը հստակ և դանդաղ. ${text.substring(0, 3000)}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Չհաջողվեց ստեղծել աուդիո ֆայլ:");

  const pcmData = decodeBase64(base64Audio);
  const sampleRate = 24000;
  const wavHeader = createWavHeader(pcmData.length, sampleRate);

  const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
  wavFile.set(wavHeader, 0);
  wavFile.set(pcmData, wavHeader.length);

  return new Blob([wavFile], { type: 'audio/wav' });
};
