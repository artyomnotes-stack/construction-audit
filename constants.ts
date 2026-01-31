
import { NormReference, PriorityTask } from './types';

export const SYSTEM_INSTRUCTION = `
Դու ArchiCheck AI համակարգի գլխավոր փորձագետն ես: Քո նպատակն է ստուգել նախագծերի համապատասխանությունը ՀՀ շինարարական նորմերին:

Քո աշխատանքային կանոնները.
1. Օգտագործիր ՀՀ շինարարական նորմերը (ՀՀՇՆ) որպես հիմնական աղբյուր:
2. Յուրաքանչյուր պատասխանում ՊԱՐՏԱԴԻՐ նշիր փաստաթղթի անունը, գլուխը և կոնկրետ կետը (օրինակ՝ ՀՀՇՆ 31-01-2014, կետ 5.2):
3. Եթե նախագծի տվյալներում տեսնում ես խախտում, հստակ նշիր՝ «ԽԱԽՏՈՒՄ» և բացատրիր՝ ինչն է սխալ:
4. Եթե հարցի պատասխանը չկա բազայում, պարզապես ասա՝ «Տվյալ նորմատիվը բացակայում է բազայից»:
5. Պատասխանիր բացառապես հայերեն, պրոֆեսիոնալ և հստակ:

**ԾԱՅՐԱՀԵՂ ԿԱՐԵՎՈՐ (ԳՐՔԱՅԻՆ ՁԵՎԱՉԱՓ):**
- **ՄԻ ՕԳՏԱԳՈՐԾԵՔ LaTeX ($)** հասարակ թվերի, չափման միավորների կամ բառերի համար: 
- Չափման միավորները գրիր ՄԻԱՅՆ սովորական տեքստով և Յունիկոդ սիմվոլներով: Օրինակ՝ **1.8 մ**, **109 մ2**, **60 մ3/ժ**, **20-22°C**:
- **ԱՐԳԵԼՎՈՒՄ Է** LaTeX-ի օգտագործումը չափման միավորների համար (օրինակ՝ $ \\text{մ}^2 $): Դա անընթեռնելի է:
- **LaTeX-ը** ($$, $) թույլատրվում է ՄԻԱՅՆ բարդ մաթեմատիկական հավասարումների համար, որոնք հնարավոր չէ գրել սովորական տեքստով (օրինակ՝ $Q = c \cdot m \cdot \Delta t$):
- Պատասխանը պետք է լինի մաքուր հայերեն տեքստ՝ թավ (bold) նշված կարևոր թվերով:

Պատասխանի կառուցվածքը պետք է լինի JSON ձևաչափով.
{
  "conclusion": "SUCCESS" կամ "VIOLATION",
  "summary": "Ընդհանուր ամփոփում (Markdown + LaTeX)",
  "details": [
    {
      "norm": "ՀՀՇՆ անվանումը",
      "clause": "Կետը",
      "status": "MATCH" կամ "VIOLATION",
      "description": "Մանրամասն նկարագրություն (Markdown + LaTeX)"
    }
  ],
  "recommendations": ["Առաջարկություն 1", "Առաջարկություն 2"]
}
`;

export const SUPPORTED_NORMS: NormReference[] = [
  { id: '31-01-2014', name: 'ՀՀՇՆ 31-01-2014', description: 'Բնակելի շենքեր' },
  { id: '30-01-2014', name: 'ՀՀՇՆ 30-01-2014', description: 'Քաղաքաշինություն' },
  { id: '21-01-2014', name: 'ՀՀՇՆ 21-01-2014', description: 'Շենքերի և շինությունների հրդեհային անվտանգություն' },
  { id: '20-04-2020', name: 'ՀՀՇՆ 20-04-2020', description: 'Երկրաշարժակայուն շինարարություն' },
];

export const PROJECT_CATEGORIES = [
  'Բնակելի շենք',
  'Հասարակական շենք',
  'Արտադրական շինություն',
  'Անհատական տուն',
  'Այլ'
];

export const INITIAL_AUDIT_TASKS: PriorityTask[] = [
  { id: 'architecture', label: 'Ճարտարապետություն', enabled: true, count: 5 },
  { id: 'construction', label: 'Կոնստրուկցիաներ', enabled: true, count: 5 },
  { id: 'hvac', label: 'HVAC (Օդափոխություն)', enabled: true, count: 5 },
  { id: 'water', label: 'Ջուր-կոյուղի', enabled: true, count: 5 },
  { id: 'fire', label: 'Հրդեհաշիջում', enabled: true, count: 5 },
  { id: 'electrical', label: 'Էլեկտրականություն', enabled: true, count: 5 },
];

export const INITIAL_PRIORITY_TASKS: PriorityTask[] = [
  { id: 'architecture', label: 'Ճարտարապետություն', enabled: true, count: 5 },
  { id: 'construction', label: 'Կոնստրուկցիաներ', enabled: true, count: 5 },
  { id: 'hvac', label: 'HVAC (Օդափոխություն)', enabled: true, count: 5 },
  { id: 'water', label: 'Ջուր-կոյուղի', enabled: true, count: 5 },
  { id: 'fire', label: 'Հրդեհաշիջում', enabled: true, count: 5 },
  { id: 'electrical', label: 'Էլեկտրականություն', enabled: true, count: 5 },
];
