/**
 * translationService.ts
 * Complete pedagogical translation dictionary for all Math & Science hardcoded cases (49 exercises)
 * Automatically synchronized 1-to-1 with math.json & science.json
 */

export interface CaseKhmerData {
  titleKhmer?: string;
  statementKhmer: string;
  steps: {
    questionKhmer: string;
    socraticPromptKhmer?: string;
    hint1Khmer?: string;
    hint2Khmer?: string;
    hint3Khmer?: string;
    explainKhmer?: string;
  }[];
  hintsKhmer?: string[];
  explainKhmer?: {
    messageKhmer: string;
    questionKhmer: string;
  };
}

export const HARDCODED_KHMER_TRANSLATIONS: Record<string, CaseKhmerData> = {
  "math_p1_a1": {
    "statementKhmer": "៤ + ៥ + ៦ = ___",
    "steps": [
      {
        "questionKhmer": "តោះចាប់ផ្ដើមជាមួយលេខពីរដំបូង។ តើ ៤ + ៥ ស្មើនឹងប៉ុន្មាន?",
        "socraticPromptKhmer": "តើផលបូក ៤ + ៥ ស្មើប៉ុន្មាន?",
        "hint1Khmer": "ចាប់ផ្តើមពីលេខធំ ហើយរាប់បន្ថែមទៅមុខ។"
      },
      {
        "questionKhmer": "ល្អណាស់! ឥឡូវតើយើងគួរធ្វើអ្វីជាមួយលេខ ៦ បន្ទាប់?",
        "socraticPromptKhmer": "តើយើងត្រូវធ្វើប្រមាណវិធីអ្វីជាមួយលេខ ៦ ដែលនៅសល់?",
        "hint1Khmer": "យើងនៅសល់លេខ ៦ មួយទៀតដែលត្រូវបូកបញ្ចូលជាមួយផលបូកមុន។"
      },
      {
        "questionKhmer": "តើ ៩ + ៦ ស្មើនឹងប៉ុន្មាន?",
        "socraticPromptKhmer": "តើ ៩ + ៦ ស្មើប៉ុន្មាន?",
        "hint1Khmer": "រាប់បន្ថែម ៦ ពី ៩ ឬប្រើវិធីបង្គ្រប់ដប់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p1_a2": {
    "statementKhmer": "៧ + ៣ + ២ + ៥ = ___",
    "steps": [
      {
        "questionKhmer": "តើលេខពីរណាខ្លះដែលបូកបញ្ចូលគ្នាបង្កើតបាន ១០?",
        "socraticPromptKhmer": "ស្វែងរកគូដែលបូកចូលគ្នាបាន ១០ (គូបំពេញដប់)។",
        "hint1Khmer": "គិតអំពីគូបំពេញដប់៖ ៧ ត្រូវការប៉ុន្មានទៀតដើម្បីបាន ១០?"
      },
      {
        "questionKhmer": "បន្ទាប់ពីបង្កើតបាន ១០ ហើយ តើនៅសល់លេខពីរណាខ្លះទៀត?",
        "socraticPromptKhmer": "តើលេខពីរណាដែលនៅសល់មិនទាន់បានបូក?",
        "hint1Khmer": "ក្រឡេកមើលលេខក្នុងសំណួរដើម ហើយដកលេខដែលបានបូករួចចេញ។"
      },
      {
        "questionKhmer": "តើ ២ + ៥ ស្មើនឹងប៉ុន្មាន?",
        "socraticPromptKhmer": "តើ ២ + ៥ ស្មើប៉ុន្មាន?",
        "hint1Khmer": "រាប់បន្ថែម ៥ ពី ២ ឬប្រើវិធីបង្គ្រប់ដប់។"
      },
      {
        "questionKhmer": "ឥឡូវបូកក្រុម ១០ ជាមួយផលបូកនៃលេខសល់៖ តើទទួលបានផលបូកសរុបប៉ុន្មាន?",
        "socraticPromptKhmer": "តើ ១០ បូកជាមួយផលបូកមុន ស្មើនឹងប៉ុន្មាន?",
        "hint1Khmer": "បូកខ្ទង់ដប់ (១០) ជាមួយខ្ទង់រាយ។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p1_a3": {
    "statementKhmer": "៨ + ១ + ៤ = ___",
    "steps": [
      {
        "questionKhmer": "តើ ៨ + ១ ស្មើនឹងប៉ុន្មាន?",
        "socraticPromptKhmer": "តើ ៨ + ១ ស្មើប៉ុន្មាន?",
        "hint1Khmer": "រាប់បន្ថែម ១ ពី ៨ ឬប្រើវិធីបង្គ្រប់ដប់។"
      },
      {
        "questionKhmer": "តើ ៩ + ៤ ស្មើនឹងប៉ុន្មាន?",
        "socraticPromptKhmer": "តើ ៩ + ៤ ស្មើប៉ុន្មាន?",
        "hint1Khmer": "រាប់បន្ថែម ៤ ពី ៩ ឬប្រើវិធីបង្គ្រប់ដប់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p1_a4": {
    "statementKhmer": "៩ + ២ + ៣ + ១ = ___",
    "steps": [
      {
        "questionKhmer": "Which two numbers can make ១០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What numbers are left?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "តើ ២ + ៣ ស្មើនឹងប៉ុន្មាន?",
        "socraticPromptKhmer": "តើ ២ + ៣ ស្មើប៉ុន្មាន?",
        "hint1Khmer": "រាប់បន្ថែម ៣ ពី ២ ឬប្រើវិធីបង្គ្រប់ដប់។"
      },
      {
        "questionKhmer": "Now combine your ១០ and ៥.",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p1_a5": {
    "statementKhmer": "៦ + ៦ + ៤ = ___",
    "steps": [
      {
        "questionKhmer": "តើ ៦ + ៤ ស្មើនឹងប៉ុន្មាន?",
        "socraticPromptKhmer": "តើ ៦ + ៤ ស្មើប៉ុន្មាន?",
        "hint1Khmer": "រាប់បន្ថែម ៤ ពី ៦ ឬប្រើវិធីបង្គ្រប់ដប់។"
      },
      {
        "questionKhmer": "Which number is left?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Now add ១០ and ៦.",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p1_b1": {
    "statementKhmer": "៣០ + ___ = ១០០",
    "steps": [
      {
        "questionKhmer": "តើតួលេខគោលដៅសរុបដែលយើងចង់បានស្មើនឹងប៉ុន្មាន?",
        "socraticPromptKhmer": "តើចំនួនចុងក្រោយដែលយើងចង់បង្គ្រប់គឺប៉ុន្មាន?",
        "hint1Khmer": "ពិនិត្យមើលលេខនៅខាងស្ដាំសញ្ញាស្មើ (=) ក្នុងសំណួរ។"
      },
      {
        "questionKhmer": "រាប់ឡើងជាដប់ពី ៣០ ទៅដល់ ១០០៖ តើត្រូវការប៉ុន្មានដប់?",
        "socraticPromptKhmer": "តើពី ៣០ ទៅដល់ ១០០ មានប៉ុន្មានដប់?",
        "hint1Khmer": "រាប់ឡើងជាដប់ពី ៣០ (ឧ. ៣០, ...) រហូតដល់ ១០០។"
      },
      {
        "questionKhmer": "តើ ៧ ដប់ ស្មើនឹងចំនួនសរុបប៉ុន្មាន?",
        "socraticPromptKhmer": "តើ ៧ ដប់ ស្មើនឹងលេខប៉ុន្មាន?",
        "hint1Khmer": "រាប់ជាដប់ចំនួន ៧ ដង ឬគុណ ៧ ជាមួយ ១០។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p1_b2": {
    "statementKhmer": "២០ + ___ = ១០០",
    "steps": [
      {
        "questionKhmer": "តើតួលេខគោលដៅសរុបដែលយើងចង់បានស្មើនឹងប៉ុន្មាន?",
        "socraticPromptKhmer": "តើចំនួនចុងក្រោយដែលយើងចង់បង្គ្រប់គឺប៉ុន្មាន?",
        "hint1Khmer": "ពិនិត្យមើលលេខនៅខាងស្ដាំសញ្ញាស្មើ (=) ក្នុងសំណួរ។"
      },
      {
        "questionKhmer": "រាប់ឡើងជាដប់ពី ២០ ទៅដល់ ១០០៖ តើត្រូវការប៉ុន្មានដប់?",
        "socraticPromptKhmer": "តើពី ២០ ទៅដល់ ១០០ មានប៉ុន្មានដប់?",
        "hint1Khmer": "រាប់ឡើងជាដប់ពី ២០ (ឧ. ២០, ...) រហូតដល់ ១០០។"
      },
      {
        "questionKhmer": "តើ ៨ ដប់ ស្មើនឹងចំនួនសរុបប៉ុន្មាន?",
        "socraticPromptKhmer": "តើ ៨ ដប់ ស្មើនឹងលេខប៉ុន្មាន?",
        "hint1Khmer": "រាប់ជាដប់ចំនួន ៨ ដង ឬគុណ ៨ ជាមួយ ១០។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p1_b3": {
    "statementKhmer": "៣៥ + ___ = ១០០",
    "steps": [
      {
        "questionKhmer": "How much does ៣៥ need to reach the next multiple of ១០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "After reaching ៤០, how much more is needed to reach ១០០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Combine those two parts.",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p1_b4": {
    "statementKhmer": "៤៨ + ___ = ១០០",
    "steps": [
      {
        "questionKhmer": "How much more does ៤៨ need to become ៥០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "After ៥០, how much more is needed to reach ១០០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "តើ ២ + ៥០ ស្មើនឹងប៉ុន្មាន?",
        "socraticPromptKhmer": "តើ ២ + ៥០ ស្មើប៉ុន្មាន?",
        "hint1Khmer": "រាប់បន្ថែម ៥០ ពី ២ ឬប្រើវិធីបង្គ្រប់ដប់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p1_b5": {
    "statementKhmer": "៦៧ + ___ = ១០០",
    "steps": [
      {
        "questionKhmer": "How much does ៦៧ need to reach ៧០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "How much is needed from ៧០ to ១០០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Combine the two distances.",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p1_b6": {
    "statementKhmer": "៥៤ + ___ = ១០០",
    "steps": [
      {
        "questionKhmer": "How much does ៥៤ need to reach ៦០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "How much is needed from ៦០ to ១០០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "តើ ៦ + ៤០ ស្មើនឹងប៉ុន្មាន?",
        "socraticPromptKhmer": "តើ ៦ + ៤០ ស្មើប៉ុន្មាន?",
        "hint1Khmer": "រាប់បន្ថែម ៤០ ពី ៦ ឬប្រើវិធីបង្គ្រប់ដប់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p8_a1": {
    "statementKhmer": "Write the hundreds, tens, and ones. Then write ១០ more and ១០ less: ១៤៦",
    "steps": [
      {
        "questionKhmer": "In ១៤៦, what digit is in the hundreds place?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What digit is in the tens place?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What digit is in the ones place?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "If we add one ten, which digit changes?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "If we remove one ten, which digit changes?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p8_a2": {
    "statementKhmer": "Write the hundreds, tens, and ones. Then write ១០ more and ១០ less: ៣០៨",
    "steps": [
      {
        "questionKhmer": "Which digit is in the hundreds place?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Which digit is in the tens place?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Which digit is in the ones place?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What happens to ៣០៨ when one ten is added?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What happens when one ten is removed?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p8_a3": {
    "statementKhmer": "Write the hundreds, tens, and ones. Then write ១០ more and ១០ less: ២៣៥",
    "steps": [
      {
        "questionKhmer": "What digit is in the hundreds place?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What digit is in the tens place?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What digit is in the ones place?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What happens when we add one ten?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What happens when we remove one ten?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p8_a4": {
    "statementKhmer": "Write the hundreds, tens, and ones. Then write ១០ more and ១០ less: ៤៧២",
    "steps": [
      {
        "questionKhmer": "Which digit represents hundreds?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Which digit represents tens?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Which digit represents ones?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "If one ten is added, which place changes?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "If one ten is removed, which place changes?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p8_b2": {
    "statementKhmer": "៣៥ + ៩ = ___",
    "steps": [
      {
        "questionKhmer": "What number is ៩ close to?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "If you add ១០ instead of ៩ to ៣៥, what do you get?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "We added one too many. What should we do?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What number do you get after adjusting?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p8_b6": {
    "statementKhmer": "៧៤ - ៩ = ___",
    "steps": [
      {
        "questionKhmer": "What number is ៩ close to?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What is ៧៤ - ១០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "We subtracted one too many. What should we do?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What is the adjusted result?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p8_b3": {
    "statementKhmer": "៥៨ + ១១ = ___",
    "steps": [
      {
        "questionKhmer": "How many tens and ones are in ១១?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What happens when you add ១០ to ៥៨?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Now add the remaining ១.",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p8_b7": {
    "statementKhmer": "៥២ - ១១ = ___",
    "steps": [
      {
        "questionKhmer": "How can we split ១១ into tens and ones?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What is ៥២ - ១០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Now subtract the remaining ១.",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p8_b4": {
    "statementKhmer": "២៧ + ៣០ = ___",
    "steps": [
      {
        "questionKhmer": "How many tens are in ៣០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What happens when you add ៣ tens to ២៧?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What number do you get?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p8_b8": {
    "statementKhmer": "៩១ - ២០ = ___",
    "steps": [
      {
        "questionKhmer": "How many tens are in ២០?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What happens when you subtract two tens from ៩១?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What number remains?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p16_a1": {
    "statementKhmer": "How many days are in this month?",
    "steps": [
      {
        "questionKhmer": "What month is shown on the calendar?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What is the last numbered date shown?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "So how many days does this month have?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p16_a2": {
    "statementKhmer": "What day is ១៤ August?",
    "steps": [
      {
        "questionKhmer": "Find the number ១៤. Which row is it in?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Look at the weekday heading above ១៤. What column is it under?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "So what day is ១៤ August?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p16_a3": {
    "statementKhmer": "What date is one week after ៨ August?",
    "steps": [
      {
        "questionKhmer": "How many days are in one week?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Start at ៨ August. What date comes one day later?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "If we move forward seven days, where do we land?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p16_a4": {
    "statementKhmer": "Circle ៣១ August.",
    "steps": [
      {
        "questionKhmer": "What number are you looking for?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Look at the calendar. Can you find the number ៣១?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Tap or circle the date you found.",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p16_b1": {
    "statementKhmer": "១ week = ____ days",
    "steps": [
      {
        "questionKhmer": "How many weekday columns are shown in a full week?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "How many days does one full week have?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p16_b2": {
    "statementKhmer": "១ fortnight = ____ weeks",
    "steps": [
      {
        "questionKhmer": "Look at the calendar facts on the worksheet. What does it say about a fortnight?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "So how many weeks should go in the blank?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p16_b3": {
    "statementKhmer": "១ year = ____ months",
    "steps": [
      {
        "questionKhmer": "How many month names are listed from January to December?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "So how many months are in one year?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p16_b4": {
    "statementKhmer": "A common year = ____ days",
    "steps": [
      {
        "questionKhmer": "Look at the calendar facts. What kind of year has ៣៦៥ days?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "What number should fill the blank?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p16_b5": {
    "statementKhmer": "A leap year = ____ days",
    "steps": [
      {
        "questionKhmer": "Look at the calendar facts. What number is written next to leap year?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Why does a leap year have one more day than a common year?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "math_p16_b6": {
    "statementKhmer": "February usually has ____ days",
    "steps": [
      {
        "questionKhmer": "Which month are we thinking about?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Look at the printed calendar facts. What does it say about February usually?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      },
      {
        "questionKhmer": "Why can February sometimes have one extra day?",
        "socraticPromptKhmer": "តើអ្នកគិតថាចម្លើយជាអ្វី?",
        "hint1Khmer": "សូមអានសំណួរ និងពិនិត្យមើលតួលេខឱ្យបានច្បាស់លាស់។"
      }
    ],
    "hintsKhmer": [
      "បូកលេខ ឬរាប់ជាដប់ជាជំហានៗដោយប្រុងប្រយ័ត្ន។",
      "ប្រើវិធីបង្គ្រប់ដប់ ឬរាប់បន្ថែមពីលេខធំ។",
      "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ២០ + ___ = ១០០ យើងរាប់ជាដប់ពី ២០ ទៅដល់ ១០០ ត្រូវការ ៨ ដប់ គឺ ៨០!"
    ],
    "explainKhmer": {
      "messageKhmer": "ឧទាហរណ៍ស្រដៀងគ្នា៖ បើមាន ៣០ + ___ = ១០០ យើងអាចគិតថា ១០០ ដក ៣០ នៅសល់ ៧០។",
      "questionKhmer": "តើអ្នកអាចប្រើវិធីដក ឬរាប់ឡើងជាដប់បានទេ?"
    }
  },
  "science_p8_flamingo": {
    "statementKhmer": "គូសសញ្ញាគ្រីស (✓) ឬខ្វែង (✗) ដើម្បីពិពណ៌នាអំពីលក្ខណៈរបស់សត្វផ្លាមីងហ្គោ។",
    "steps": [
      {
        "questionKhmer": "តើសត្វផ្លាមីងហ្គោមានឆ្អឹងកង ឬឆ្អឹងខ្នងដែរឬទេ?",
        "socraticPromptKhmer": "តើសត្វស្លាបដូចជាផ្លាមីងហ្គោមានឆ្អឹងខ្នងខាងក្នុងទ្រទ្រង់រាងកាយដែរទេ?",
        "hint1Khmer": "សត្វស្លាបទាំងអស់ស្ថិតក្នុងក្រុមសត្វមានឆ្អឹងកង។"
      },
      {
        "questionKhmer": "តើអ្វីដែលគ្របដណ្តប់លើខ្លួនសត្វផ្លាមីងហ្គោ៖ រោមស្លាប រោមសត្វ ឬស្រកា?",
        "socraticPromptKhmer": "តើខ្លួនរបស់វាមានរោមស្លាបពណ៌ផ្កាឈូកដែរឬទេ?",
        "hint1Khmer": "សត្វបក្សីមានរោមស្លាបសម្រាប់ការពារខ្លួន និងជួយក្នុងការហោះហើរ។"
      },
      {
        "questionKhmer": "ក្រឡេកមើលខ្នងរបស់វា តើវាមានបូកដូចសត្វអូដ្ឋដែរឬទេ?",
        "socraticPromptKhmer": "តើខ្នងរបស់សត្វផ្លាមីងហ្គោមានដុំបូកទេ?",
        "hint1Khmer": "បូកគឺជាលក្ខណៈពិសេសរបស់សត្វអូដ្ឋ មិនមែនសត្វស្លាបទេ។"
      },
      {
        "questionKhmer": "តើសត្វផ្លាមីងហ្គោមានដង្កៀបដូចសត្វបង្កងដែរឬទេ?",
        "socraticPromptKhmer": "តើជើង ឬមាត់របស់វាមានដង្កៀបទេ?",
        "hint1Khmer": "ដង្កៀបជាលក្ខណៈរបស់សត្វដូចជាក្តាម ឬបង្កង។"
      },
      {
        "questionKhmer": "តើសត្វផ្លាមីងហ្គោមានស្លាបសម្រាប់ហោះហើរដែរឬទេ?",
        "socraticPromptKhmer": "តើសត្វផ្លាមីងហ្គោមានស្លាបធំៗសងខាងទេ?",
        "hint1Khmer": "ផ្លាមីងហ្គោជាសត្វបក្សីដែលមានស្លាបធំៗសម្រាប់ហោះហើរ។"
      }
    ],
    "hintsKhmer": [
      "គិតអំពីលក្ខណៈចម្បងរបស់សត្វបក្សី (សត្វស្លាប)។",
      "ពិនិត្យមើលរាងកាយ និងផ្នែកស្លាបរបស់សត្វផ្លាមីងហ្គោ។",
      "ប្រៀបធៀបសត្វផ្លាមីងហ្គោជាមួយសត្វដទៃទៀតក្នុងតារាង។"
    ],
    "explainKhmer": {
      "messageKhmer": "ផ្លាមីងហ្គោជាសត្វស្លាប (បក្សី) ដែលមានឆ្អឹងខ្នង រោមស្លាប និងស្លាប តែគ្មានបូក ឬដង្កៀបឡើយ។",
      "questionKhmer": "តើអ្នកសង្កេតឃើញលក្ខណៈអ្វីខ្លះដែលបញ្ជាក់ថាវាជាសត្វបក្សី?"
    }
  },
  "science_p8_lobster": {
    "statementKhmer": "គូសសញ្ញាគ្រីស (✓) ឬខ្វែង (✗) ដើម្បីពិពណ៌នាអំពីលក្ខណៈរបស់សត្វបង្កង។",
    "steps": [
      {
        "questionKhmer": "តើសត្វបង្កងមានឆ្អឹងខ្នងខាងក្នុងដូចមនុស្សដែរឬទេ?",
        "socraticPromptKhmer": "តើសត្វបង្កងជាសត្វមានឆ្អឹងកង ឬជាសត្វឥតឆ្អឹងកងដែលមានសម្បកក្រៅរឹង?",
        "hint1Khmer": "បង្កងគ្មានឆ្អឹងខ្នងខាងក្នុងទេ វាមានសម្បកក្រៅរឹងការពារខ្លួន។"
      },
      {
        "questionKhmer": "តើសត្វបង្កងមានរោមស្លាបដែរឬទេ?",
        "socraticPromptKhmer": "តើសម្បកក្រៅរបស់វាមានរោមស្លាបដូចសត្វបក្សីទេ?",
        "hint1Khmer": "មានតែសត្វបក្សីទេដែលមានរោមស្លាប។"
      },
      {
        "questionKhmer": "តើវាមានបូកនៅលើខ្នងដូចសត្វអូដ្ឋដែរឬទេ?",
        "socraticPromptKhmer": "តើខ្នងរបស់បង្កងមានដុំបូកទេ?",
        "hint1Khmer": "បង្កងរស់ក្នុងទឹក និងគ្មានបូកនៅលើខ្នងឡើយ។"
      },
      {
        "questionKhmer": "ក្រឡេកមើលផ្នែកខាងមុខនៃបង្កង តើវាមានផ្នែកពិសេសអ្វីខ្លះ (ដង្កៀប)?",
        "socraticPromptKhmer": "តើសត្វបង្កងមានដង្កៀបធំៗនៅខាងមុខទេ?",
        "hint1Khmer": "បង្កងមានដង្កៀបធំពីរនៅខាងមុខសម្រាប់ចាប់ចំណី និងការពារខ្លួន។"
      },
      {
        "questionKhmer": "តើសត្វបង្កងមានស្លាបដែរឬទេ?",
        "socraticPromptKhmer": "តើបង្កងអាចហោះហើរដោយស្លាបបានទេ?",
        "hint1Khmer": "បង្កងជាសត្វរស់ក្នុងទឹក វាមិនមានស្លាបទេ។"
      }
    ],
    "hintsKhmer": [
      "ក្រឡេកមើលដង្កៀបខាងមុខរបស់បង្កង។",
      "បង្កងមិនមែនជាសត្វបក្សីទេ ដូច្នេះវាមិនមានរោមស្លាប ឬស្លាបឡើយ។",
      "គិតថាតើរាងកាយរបស់វាមានឆ្អឹងខ្នងខាងក្នុង ឬជាសម្បកក្រៅរឹង។"
    ],
    "explainKhmer": {
      "messageKhmer": "បង្កងជាសត្វឥតឆ្អឹងកងរស់ក្នុងទឹក ដែលមានដង្កៀបរឹងមាំ តែគ្មានរោមស្លាប ឬស្លាបឡើយ។",
      "questionKhmer": "តើបង្កងមានលក្ខណៈអ្វីខុសប្លែកពីសត្វផ្លាមីងហ្គោ?"
    }
  },
  "science_p8_camel": {
    "statementKhmer": "គូសសញ្ញាគ្រីស (✓) ឬខ្វែង (✗) ដើម្បីពិពណ៌នាអំពីលក្ខណៈរបស់សត្វអូដ្ឋ។",
    "steps": [
      {
        "questionKhmer": "តើសត្វអូដ្ឋមានឆ្អឹងកង ឬឆ្អឹងខ្នងដែរឬទេ?",
        "socraticPromptKhmer": "តើសត្វអូដ្ឋជាសត្វមានឆ្អឹងកង (ថនិកសត្វ) មែនទេ?",
        "hint1Khmer": "អូដ្ឋជាថនិកសត្វធំមួយដែលមានឆ្អឹងខ្នងខាងក្នុងរឹងមាំ។"
      },
      {
        "questionKhmer": "តើរាងកាយសត្វអូដ្ឋមានរោមស្លាបដូចសត្វបក្សីដែរឬទេ?",
        "socraticPromptKhmer": "តើអូដ្ឋមានរោមស្លាបទេ?",
        "hint1Khmer": "អូដ្ឋមានរោមសត្វធម្មតា (fur) មិនមែនរោមស្លាប (feathers) ទេ។"
      },
      {
        "questionKhmer": "តើអ្នកឃើញរូបរាងពិសេសអ្វីនៅលើខ្នងសត្វអូដ្ឋ (បូក)?",
        "socraticPromptKhmer": "តើសត្វអូដ្ឋមានបូកនៅលើខ្នងសម្រាប់ស្តុកជាតិខ្លាញ់ទេ?",
        "hint1Khmer": "អូដ្ឋមានបូកលេចធ្លោនៅលើខ្នងរបស់វា។"
      },
      {
        "questionKhmer": "តើសត្វអូដ្ឋមានដង្កៀបដែរឬទេ?",
        "socraticPromptKhmer": "តើជើងសត្វអូដ្ឋមានដង្កៀបទេ?",
        "hint1Khmer": "អូដ្ឋមានក្រចកជើងក្រចកព្រែក មិនមែនដង្កៀបទេ។"
      },
      {
        "questionKhmer": "តើសត្វអូដ្ឋមានស្លាបដែរឬទេ?",
        "socraticPromptKhmer": "តើអូដ្ឋមានស្លាបទេ?",
        "hint1Khmer": "អូដ្ឋជាសត្វដើរលើដីខ្សាច់ គ្មានស្លាបទេ។"
      }
    ],
    "hintsKhmer": [
      "អូដ្ឋជាសត្វវាលខ្សាច់ដែលមានបូកនៅលើខ្នង។",
      "អូដ្ឋជាថនិកសត្វដែលមានឆ្អឹងខ្នង។"
    ],
    "explainKhmer": {
      "messageKhmer": "អូដ្ឋជាសត្វមានឆ្អឹងកង និងមានបូកនៅលើខ្នងសម្រាប់ស្តុកជាតិខ្លាញ់។",
      "questionKhmer": "តើលក្ខណៈពិសេសអ្វីនៅលើខ្នងអូដ្ឋដែលជួយឱ្យវារស់នៅវាលខ្សាច់?"
    }
  },
  "science_p8_giraffe": {
    "statementKhmer": "គូសសញ្ញាគ្រីស (✓) ឬខ្វែង (✗) ដើម្បីពិពណ៌នាអំពីលក្ខណៈរបស់សត្វហ្ស៊ីរ៉ាហ្វ។",
    "steps": [
      {
        "questionKhmer": "តើសត្វហ្ស៊ីរ៉ាហ្វមានឆ្អឹងកង ឬឆ្អឹងខ្នងដែរឬទេ?",
        "socraticPromptKhmer": "តើសត្វហ្ស៊ីរ៉ាហ្វជាសត្វមានឆ្អឹងកងកវែងមែនទេ?",
        "hint1Khmer": "ហ្ស៊ីរ៉ាហ្វមានឆ្អឹងកងកវែង និងឆ្អឹងខ្នងរឹងមាំ។"
      },
      {
        "questionKhmer": "តើរាងកាយរបស់វាគ្របដណ្តប់ដោយរោមស្លាបដែរឬទេ?",
        "socraticPromptKhmer": "តើសត្វហ្ស៊ីរ៉ាហ្វមានរោមស្លាបទេ?",
        "hint1Khmer": "ហ្ស៊ីរ៉ាហ្វជាថនិកសត្វ មិនមែនបក្សីទេ ដូច្នេះគ្មានរោមស្លាបឡើយ។"
      },
      {
        "questionKhmer": "តើវាមានបូកនៅលើខ្នងដូចសត្វអូដ្ឋដែរឬទេ?",
        "socraticPromptKhmer": "តើខ្នងរបស់ហ្ស៊ីរ៉ាហ្វមានបូកទេ?",
        "hint1Khmer": "ហ្ស៊ីរ៉ាហ្វមានខ្នងរាងជម្រាល មិនមានដុំបូកដូចអូដ្ឋទេ។"
      },
      {
        "questionKhmer": "តើសត្វហ្ស៊ីរ៉ាហ្វមានដង្កៀបដែរឬទេ?",
        "socraticPromptKhmer": "តើជើងរបស់វាមានដង្កៀបទេ?",
        "hint1Khmer": "ហ្ស៊ីរ៉ាហ្វមានក្រចកជើងរឹងមាំ គ្មានដង្កៀបទេ។"
      },
      {
        "questionKhmer": "តើសត្វហ្ស៊ីរ៉ាហ្វមានស្លាបដែរឬទេ?",
        "socraticPromptKhmer": "តើហ្ស៊ីរ៉ាហ្វមានស្លាបទេ?",
        "hint1Khmer": "ហ្ស៊ីរ៉ាហ្វជាសត្វលើគោក គ្មានស្លាបទេ។"
      }
    ],
    "hintsKhmer": [
      "ហ្ស៊ីរ៉ាហ្វជាថនិកសត្វកវែងដែលមានឆ្អឹងកង។",
      "ពិនិត្យមើលលក្ខណៈខ្នង និងស្បែករបស់វា។"
    ],
    "explainKhmer": {
      "messageKhmer": "ហ្ស៊ីរ៉ាហ្វជាសត្វមានឆ្អឹងកង តែគ្មានរោមស្លាប បូក ដង្កៀប ឬស្លាបឡើយ។",
      "questionKhmer": "តើហ្ស៊ីរ៉ាហ្វមានឆ្អឹងកងដែរឬទេ?"
    }
  },
  "science_p8_slug": {
    "statementKhmer": "គូសសញ្ញាគ្រីស (✓) ឬខ្វែង (✗) ដើម្បីពិពណ៌នាអំពីលក្ខណៈរបស់សត្វខ្យងឥតសំបក (Slug)។",
    "steps": [
      {
        "questionKhmer": "តើសត្វខ្យងឥតសំបកមានឆ្អឹងខ្នងដូចហ្ស៊ីរ៉ាហ្វ ឬអូដ្ឋដែរឬទេ?",
        "socraticPromptKhmer": "តើសត្វខ្យងឥតសំបកជាសត្វឥតឆ្អឹងកងដែលមានខ្លួនទន់មែនទេ?",
        "hint1Khmer": "ខ្យងឥតសំបកមានរាងកាយទន់ និងគ្មានឆ្អឹងខ្នងខាងក្នុងទេ។"
      },
      {
        "questionKhmer": "តើសត្វខ្យងឥតសំបកមានរោមស្លាបដែរឬទេ?",
        "socraticPromptKhmer": "តើវាមានរោមស្លាបទេ?",
        "hint1Khmer": "រាងកាយរបស់វាទន់ និងមានទឹករំអិល គ្មានរោមស្លាបទេ។"
      },
      {
        "questionKhmer": "តើវាមានបូកនៅលើខ្នងដែរឬទេ?",
        "socraticPromptKhmer": "តើខ្នងរបស់វាមានបូកទេ?",
        "hint1Khmer": "ខ្នងរបស់វាទន់រលោង គ្មានដុំបូកឡើយ។"
      },
      {
        "questionKhmer": "តើវាមានដង្កៀបដូចបង្កងដែរឬទេ?",
        "socraticPromptKhmer": "តើវាមានដង្កៀបទេ?",
        "hint1Khmer": "ខ្យងឥតសំបកគ្មានដង្កៀប ឬជើងឡើយ។"
      },
      {
        "questionKhmer": "តើសត្វខ្យងឥតសំបកមានស្លាបដែរឬទេ?",
        "socraticPromptKhmer": "តើវាមានស្លាបទេ?",
        "hint1Khmer": "វាវាលើដី មិនមានស្លាបទេ។"
      }
    ],
    "hintsKhmer": [
      "ខ្យងឥតសំបកជាសត្វឥតឆ្អឹងកងដែលមានរាងកាយទន់។",
      "វាមិនមានលក្ខណៈណាមួយក្នុងចំណោមលក្ខណៈទាំង ៥ ខាងលើឡើយ (ខ្វែងទាំងអស់)។"
    ],
    "explainKhmer": {
      "messageKhmer": "ខ្យងឥតសំបកជាសត្វឥតឆ្អឹងកងខ្លួនទន់ ដែលគ្មានលក្ខណៈណាមួយក្នុងចំណោមលក្ខណៈទាំង ៥ នេះឡើយ។",
      "questionKhmer": "តើខ្យងឥតសំបកមានឆ្អឹងខ្នងទេ?"
    }
  },
  "science_p8_moth": {
    "statementKhmer": "គូសសញ្ញាគ្រីស (✓) ឬខ្វែង (✗) ដើម្បីពិពណ៌នាអំពីលក្ខណៈរបស់សត្វមេអំបៅយប់ (Moth)។",
    "steps": [
      {
        "questionKhmer": "តើសត្វមេអំបៅយប់មានឆ្អឹងកង ឬឆ្អឹងខ្នងខាងក្នុងដែរឬទេ?",
        "socraticPromptKhmer": "តើវាជាសត្វល្អិតឥតឆ្អឹងកងមែនទេ?",
        "hint1Khmer": "មេអំបៅយប់ជាសត្វល្អិតឥតឆ្អឹងកង។"
      },
      {
        "questionKhmer": "តើសត្វមេអំបៅយប់មានរោមស្លាបដូចសត្វបក្សីដែរឬទេ?",
        "socraticPromptKhmer": "តើវាមានរោមស្លាបទេ?",
        "hint1Khmer": "ស្លាបរបស់វាគ្របដណ្តប់ដោយស្រកាល្អិតៗ មិនមែនរោមស្លាបបក្សីទេ។"
      },
      {
        "questionKhmer": "តើវាមានបូកនៅលើខ្នងដែរឬទេ?",
        "socraticPromptKhmer": "តើខ្នងរបស់វាមានបូកទេ?",
        "hint1Khmer": "មេអំបៅយប់គ្មានដុំបូកនៅលើខ្នងទេ។"
      },
      {
        "questionKhmer": "តើវាមានដង្កៀបដូចបង្កងដែរឬទេ?",
        "socraticPromptKhmer": "តើវាមានដង្កៀបទេ?",
        "hint1Khmer": "មេអំបៅយប់គ្មានដង្កៀបទេ។"
      },
      {
        "questionKhmer": "តើផ្នែកសំខាន់អ្វីដែលជួយឱ្យមេអំបៅយប់អាចហោះហើរបាន (ស្លាប)?",
        "socraticPromptKhmer": "តើវាមានស្លាបសម្រាប់ហោះហើរទេ?",
        "hint1Khmer": "មេអំបៅយប់មានស្លាបធំៗសម្រាប់ហោះហើរនៅពេលយប់។"
      }
    ],
    "hintsKhmer": [
      "មេអំបៅយប់ជាសត្វល្អិតដែលមានស្លាបសម្រាប់ហោះហើរ។",
      "វាជាសត្វឥតឆ្អឹងកង។"
    ],
    "explainKhmer": {
      "messageKhmer": "មេអំបៅយប់ជាសត្វល្អិតឥតឆ្អឹងកងដែលមានស្លាបសម្រាប់ហោះហើរ។",
      "questionKhmer": "តើមេអំបៅយប់មានស្លាបដែរឬទេ?"
    }
  },
  "science_p6_bird": {
    "statementKhmer": "សរសេរលក្ខណៈសម្គាល់មួយនៃក្រុមសត្វបក្សី (Bird)។",
    "steps": [
      {
        "questionKhmer": "គិតអំពីសត្វឥន្ទ្រី តើអ្វីគ្របដណ្តប់លើរាងកាយរបស់វាស្ទើរតែទាំងអស់ (រោមស្លាប)?",
        "socraticPromptKhmer": "តើអ្វីគ្របដណ្តប់លើខ្លួនសត្វឥន្ទ្រី (រោមស្លាប)?",
        "hint1Khmer": "សត្វបក្សីទាំងអស់មានរោមស្លាប (feathers) គ្របដណ្តប់រាងកាយ។"
      },
      {
        "questionKhmer": "តើរោមស្លាបជាលក្ខណៈរួមរបស់ក្រុមសត្វបក្សីមែនទេ?",
        "socraticPromptKhmer": "តើរោមស្លាបជាលក្ខណៈពិសេសរបស់បក្សីមែនទេ?",
        "hint1Khmer": "ឆ្លើយបាទ/ចាស ឬបញ្ជាក់ពីរោមស្លាប។"
      }
    ],
    "hintsKhmer": [
      "សត្វបក្សីមានលក្ខណៈពិសេសគឺរោមស្លាប (feathers) និងចំពុះ។",
      "រោមស្លាបជួយរក្សាកម្តៅ និងជួយក្នុងការហោះហើរ។"
    ],
    "explainKhmer": {
      "messageKhmer": "សត្វបក្សីទាំងអស់មានរោមស្លាបគ្របដណ្តប់រាងកាយ និងមានឆ្អឹងកង។",
      "questionKhmer": "តើលក្ខណៈសម្គាល់សំខាន់បំផុតរបស់សត្វបក្សីគឺជាអ្វី?"
    }
  },
  "science_p6_mammal": {
    "statementKhmer": "សរសេរលក្ខណៈសម្គាល់មួយនៃក្រុមសត្វថនិកសត្វ (Mammal)។",
    "steps": [
      {
        "questionKhmer": "តើសត្វដំរីស្ថិតក្នុងក្រុមសត្វប្រភេទណា (ថនិកសត្វ)?",
        "socraticPromptKhmer": "តើដំរីបំបៅកូនដោយទឹកដោះ និងជាថនិកសត្វមែនទេ?",
        "hint1Khmer": "ដំរីជាសត្វថនិកសត្វ (mammal)។"
      },
      {
        "questionKhmer": "តើអ្នកអាចប្រាប់លក្ខណៈរាងកាយទូទៅរបស់ថនិកសត្វបានទេ (បំបៅកូនដោយទឹកដោះ ឬមានរោមរាងកាយ)?",
        "socraticPromptKhmer": "តើថនិកសត្វមានរោម (fur/hair) ឬបំបៅកូនដោយទឹកដោះមែនទេ?",
        "hint1Khmer": "ថនិកសត្វមានរោមលើរាងកាយ និងបំបៅកូនដោយទឹកដោះ។"
      }
    ],
    "hintsKhmer": [
      "ថនិកសត្វបំបៅកូនដោយទឹកដោះ និងមានរោមលើរាងកាយ។"
    ],
    "explainKhmer": {
      "messageKhmer": "ថនិកសត្វជាសត្វមានឆ្អឹងកង ដែលបំបៅកូនដោយទឹកដោះ និងមានរោមលើខ្លួន។",
      "questionKhmer": "តើអ្វីជាលក្ខណៈសម្គាល់របស់ថនិកសត្វ?"
    }
  },
  "science_p6_amphibian": {
    "statementKhmer": "សរសេរលក្ខណៈសម្គាល់មួយនៃក្រុមសត្វថលជលិក (Amphibian)។",
    "steps": [
      {
        "questionKhmer": "តើសត្វអ្វីដែលត្រូវបានបង្ហាញជាតំណាងក្រុមថលជលិក (កង្កែប)?",
        "socraticPromptKhmer": "តើសត្វកង្កែបជាសត្វថលជលិករស់នៅទាំងលើគោក និងក្នុងទឹកមែនទេ?",
        "hint1Khmer": "កង្កែបជាសត្វថលជលិកដ៏សំខាន់មួយ។"
      },
      {
        "questionKhmer": "តើសត្វកង្កែបមានស្បែកសើម គ្មានស្រកា និងគ្មានរោមស្លាបមែនទេ?",
        "socraticPromptKhmer": "តើស្បែករបស់កង្កែបមានលក្ខណៈសើម និងរលោងមែនទេ?",
        "hint1Khmer": "ស្បែករបស់ថលជលិកតែងតែសើមជានិច្ច។"
      },
      {
        "questionKhmer": "តើអ្នកអាចប្រាប់លក្ខណៈសម្គាល់មួយនៃសត្វថលជលិកបានទេ (ស្បែកសើម)?",
        "socraticPromptKhmer": "តើស្បែកសើម (moist skin) ជាលក្ខណៈរបស់ថលជលិកមែនទេ?",
        "hint1Khmer": "ស្បែកសើមគ្មានស្រកា (moist skin) ជួយឱ្យពួកវាដកដង្ហើមបាន។"
      }
    ],
    "hintsKhmer": [
      "សត្វថលជលិកមានស្បែកសើម និងអាចរស់នៅទាំងក្នុងទឹកនិងលើគោក។"
    ],
    "explainKhmer": {
      "messageKhmer": "សត្វថលជលិកមានស្បែកសើមគ្មានស្រកា និងពងក្នុងទឹក។",
      "questionKhmer": "តើស្បែករបស់សត្វថលជលិកមានលក្ខណៈបែបណា?"
    }
  },
  "science_p6_reptile": {
    "statementKhmer": "សរសេរលក្ខណៈសម្គាល់មួយនៃក្រុមសត្វល្មូន (Reptile)។",
    "steps": [
      {
        "questionKhmer": "តើសត្វអ្វីត្រូវបានបង្ហាញជាតំណាងក្រុមល្មូន (ពស់)?",
        "socraticPromptKhmer": "តើសត្វពស់ ឬជីងចក់ជាសត្វល្មូនមែនទេ?",
        "hint1Khmer": "ពស់ ក្រពើ និងអណ្តើក គឺជាសត្វល្មូន។"
      },
      {
        "questionKhmer": "ក្រឡេកមើលរាងកាយពស់ តើវាមានស្រកាស្ងួតគ្របដណ្តប់មែនទេ?",
        "socraticPromptKhmer": "តើស្បែករបស់សត្វល្មូនគ្របដណ្តប់ដោយស្រកាស្ងួត (dry scales) មែនទេ?",
        "hint1Khmer": "សត្វល្មូនមានស្បែកស្ងួតគ្របដណ្តប់ដោយស្រកា។"
      }
    ],
    "hintsKhmer": [
      "សត្វល្មូនមានស្បែកស្ងួតគ្របដណ្តប់ដោយស្រកា និងពងនៅលើគោក។"
    ],
    "explainKhmer": {
      "messageKhmer": "សត្វល្មូនជាសត្វមានឆ្អឹងកងដែលមានស្បែកស្ងួត និងមានស្រកា។",
      "questionKhmer": "តើស្បែករបស់សត្វល្មូនមានលក្ខណៈដូចម្តេច?"
    }
  },
  "science_p6_fish": {
    "statementKhmer": "សរសេរលក្ខណៈសម្គាល់មួយនៃក្រុមសត្វត្រី (Fish)។",
    "steps": [
      {
        "questionKhmer": "តើសត្វត្រីរស់នៅទីណាភាគច្រើនក្នុងជីវិតរបស់វា (ក្នុងទឹក)?",
        "socraticPromptKhmer": "តើត្រីរស់នៅក្នុងទឹក និងហែលដោយប្រើព្រុយមែនទេ?",
        "hint1Khmer": "ត្រីរស់នៅក្នុងទឹក និងដកដង្ហើមតាមស្រកី។"
      },
      {
        "questionKhmer": "តើផ្នែករាងកាយអ្វីជួយឱ្យត្រីដកដង្ហើមស្រូបយកអុកស៊ីសែនពីក្នុងទឹក (ស្រកី)?",
        "socraticPromptKhmer": "តើត្រីដកដង្ហើមតាមស្រកី (gills) និងមានព្រុយ (fins) មែនទេ?",
        "hint1Khmer": "ស្រកី (gills) និងព្រុយ (fins) ជាលក្ខណៈសំខាន់របស់ត្រី។"
      }
    ],
    "hintsKhmer": [
      "ត្រីមានស្រកីសម្រាប់ដកដង្ហើមក្នុងទឹក និងមានព្រុយសម្រាប់ហែល។"
    ],
    "explainKhmer": {
      "messageKhmer": "ត្រីជាសត្វមានឆ្អឹងកងដែលរស់ក្នុងទឹក មានស្រកី និងព្រុយ។",
      "questionKhmer": "តើត្រីប្រើអ្វីដើម្បីដកដង្ហើមក្នុងទឹក?"
    }
  },
  "science_p6_invertebrate": {
    "statementKhmer": "តើយើងហៅសត្វដែលគ្មានឆ្អឹងកងថាជាសត្វអ្វី?",
    "steps": [
      {
        "questionKhmer": "តើយើងហៅសត្វដែលមានឆ្អឹងកងខ្នងថាជាអ្វី (សត្វមានឆ្អឹងកង)?",
        "socraticPromptKhmer": "តើសត្វដែលមានឆ្អឹងខ្នងហៅថាសត្វមានឆ្អឹងកងមែនទេ?",
        "hint1Khmer": "សត្វមានឆ្អឹងខ្នងហៅថាសត្វមានឆ្អឹងកង (Vertebrates)។"
      },
      {
        "questionKhmer": "ប្រសិនបើសត្វមួយគ្មានឆ្អឹងកងខ្នង តើវាស្ថិតក្នុងក្រុមដូចគ្នាដែរទេ?",
        "socraticPromptKhmer": "តើសត្វគ្មានឆ្អឹងខ្នងស្ថិតក្នុងក្រុមដាច់ដោយឡែកមួយមែនទេ?",
        "hint1Khmer": "សត្វដែលគ្មានឆ្អឹងខ្នងហៅថាសត្វឥតឆ្អឹងកង។"
      },
      {
        "questionKhmer": "តើអ្នកចាំឈ្មោះសត្វដែលគ្មានឆ្អឹងកងខ្នងទេ (សត្វឥតឆ្អឹងកង)?",
        "socraticPromptKhmer": "តើយើងហៅពួកវាថាសត្វឥតឆ្អឹងកង (Invertebrates) មែនទេ?",
        "hint1Khmer": "ពាក្យត្រឹមត្រូវគឺ «សត្វឥតឆ្អឹងកង» (Invertebrates)។"
      }
    ],
    "hintsKhmer": [
      "សត្វគ្មានឆ្អឹងខ្នងហៅថាសត្វឥតឆ្អឹងកង (Invertebrates)។"
    ],
    "explainKhmer": {
      "messageKhmer": "សត្វឥតឆ្អឹងកង (Invertebrates) គឺជាសត្វដែលគ្មានឆ្អឹងខ្នងខាងក្នុងទ្រទ្រង់រាងកាយ។",
      "questionKhmer": "តើសត្វគ្មានឆ្អឹងខ្នងហៅថាអ្វី?"
    }
  },
  "science_p44_a_plant_part": {
    "statementKhmer": "កំណត់ឈ្មោះផ្នែកនៃរុក្ខជាតិនេះដែលបង្កើតអាហារ។",
    "steps": [
      {
        "questionKhmer": "គិតអំពីផ្នែកសំខាន់ៗនៃរុក្ខជាតិ តើអ្នកអាចប្រាប់ឈ្មោះផ្នែកមួយបានទេ?",
        "socraticPromptKhmer": "តើរុក្ខជាតិមានឫស ដើម ស្លឹក និងផ្កាមែនទេ?",
        "hint1Khmer": "ផ្នែកសំខាន់ៗរួមមាន ឫស ដើម ស្លឹក ផ្កា។"
      },
      {
        "questionKhmer": "តើផ្នែកណាដែលស្រូបយកពន្លឺព្រះអាទិត្យច្រើនជាងគេ (ស្លឹក)?",
        "socraticPromptKhmer": "តើស្លឹកជាកន្លែងធ្វើរស្មីសំយោគបង្កើតអាហារមែនទេ?",
        "hint1Khmer": "ស្លឹកមានផ្ទុកក្លរ៉ូភីលដែលស្រូបយកពន្លឺព្រះអាទិត្យដើម្បីបង្កើតអាហារ។"
      },
      {
        "questionKhmer": "តើយើងគួរកំណត់ស្លាកផ្នែកណាជាផ្នែកផលិតអាហារ (ស្លឹក)?",
        "socraticPromptKhmer": "តើផ្នែកនោះគឺ «ស្លឹក» (Leaves) មែនទេ?",
        "hint1Khmer": "ចម្លើយត្រឹមត្រូវគឺ «ស្លឹក» ឬ Leaves។"
      }
    ],
    "hintsKhmer": [
      "ស្លឹកធ្វើរស្មីសំយោគដើម្បីផលិតអាហារសម្រាប់រុក្ខជាតិ។"
    ],
    "explainKhmer": {
      "messageKhmer": "ស្លឹករុក្ខជាតិជាផ្នែកចម្បងដែលធ្វើរស្មីសំយោគដើម្បីបង្កើតអាហារ។",
      "questionKhmer": "តើផ្នែកណាជួយរុក្ខជាតិបង្កើតអាហារ?"
    }
  },
  "science_p44_b_plant_eater": {
    "statementKhmer": "គូសរង្វង់ជុំវិញភាវៈរស់ដែលទំនងជានឹងស៊ីរុក្ខជាតិនេះបំផុត។",
    "steps": [
      {
        "questionKhmer": "តើជម្រើសណាខ្លះជាសត្វ (A: ទន្សាយ, B: ទីទុយ, D: ឥន្ទ្រី)?",
        "socraticPromptKhmer": "តើជម្រើសណាខ្លះជាសត្វ?",
        "hint1Khmer": "A, B, D គឺជាសត្វ ចំណែក C ជារុក្ខជាតិស្ពៃ។"
      },
      {
        "questionKhmer": "តើសត្វណាដែលគេស្គាល់ជាទូទៅថាស៊ីរុក្ខជាតិដូចជាបន្លែ (ទន្សាយ)?",
        "socraticPromptKhmer": "តើសត្វទន្សាយចូលចិត្តស៊ីស្លឹកបន្លែ និងស្ពៃក្តោបមែនទេ?",
        "hint1Khmer": "ទន្សាយជាសត្វស៊ីរុក្ខជាតិ (Herbivore)។"
      },
      {
        "questionKhmer": "តើអក្សរណាដែលតំណាងឱ្យសត្វទន្សាយ (A)?",
        "socraticPromptKhmer": "តើសត្វទន្សាយស្ថិតនៅជម្រើសអក្សរ A មែនទេ?",
        "hint1Khmer": "ជ្រើសរើសអក្សរ A ឬ ទន្សាយ។"
      }
    ],
    "hintsKhmer": [
      "ទន្សាយជាសត្វស៊ីរុក្ខជាតិដែលស៊ីស្ពៃក្តោប។"
    ],
    "explainKhmer": {
      "messageKhmer": "ទន្សាយ (ជម្រើស A) គឺជាសត្វស៊ីរុក្ខជាតិដែលស៊ីស្ពៃក្តោប។",
      "questionKhmer": "តើសត្វណាចូលចិត្តស៊ីបន្លែ?"
    }
  },
  "science_p44_c_i_producer": {
    "statementKhmer": "តើភាវៈរស់មួយណាដែលបង្កើតអាហារដោយខ្លួនឯង?",
    "steps": [
      {
        "questionKhmer": "តើជម្រើសមួយណាជារុក្ខជាតិ (C: ស្ពៃក្តោប)?",
        "socraticPromptKhmer": "តើជម្រើស C ជារុក្ខជាតិស្ពៃក្តោបមែនទេ?",
        "hint1Khmer": "ស្ពៃក្តោប (C) ជារុក្ខជាតិតែមួយគត់ក្នុងចំណោមជម្រើស។"
      },
      {
        "questionKhmer": "តើរុក្ខជាតិបង្កើតអាហារដោយខ្លួនឯងដោយប្រើពន្លឺព្រះអាទិត្យមែនទេ?",
        "socraticPromptKhmer": "តើរុក្ខជាតិជាអ្នកផលិត (Producer) មែនទេ?",
        "hint1Khmer": "រុក្ខជាតិជាអ្នកផលិតដែលបង្កើតអាហារដោយខ្លួនឯងតាមរស្មីសំយោគ។"
      },
      {
        "questionKhmer": "តើអក្សរណាដែលតំណាងឱ្យស្ពៃក្តោប (C)?",
        "socraticPromptKhmer": "តើជម្រើសត្រឹមត្រូវគឺអក្សរ C មែនទេ?",
        "hint1Khmer": "ជ្រើសរើសអក្សរ C។"
      }
    ],
    "hintsKhmer": [
      "រុក្ខជាតិស្ពៃក្តោប (C) ជាអ្នកផលិតដែលបង្កើតអាហារដោយខ្លួនឯង។"
    ],
    "explainKhmer": {
      "messageKhmer": "ស្ពៃក្តោប (ជម្រើស C) ជារុក្ខជាតិ និងជាអ្នកផលិតដែលបង្កើតអាហារដោយខ្លួនឯង។",
      "questionKhmer": "តើភាវៈរស់ណាបង្កើតអាហារដោយខ្លួនឯង?"
    }
  },
  "science_p44_c_ii_eat_animals": {
    "statementKhmer": "តើភាវៈរស់ណាខ្លះដែលស៊ីសត្វដទៃជាអាហារ?",
    "steps": [
      {
        "questionKhmer": "តើជម្រើសណាខ្លះជាសត្វស៊ីសាច់ (B: ទីទុយ, D: ឥន្ទ្រី)?",
        "socraticPromptKhmer": "តើសត្វទីទុយ និងឥន្ទ្រីជាសត្វស៊ីសាច់មែនទេ?",
        "hint1Khmer": "ទីទុយ និងឥន្ទ្រីជាសត្វស៊ីសាច់ (Carnivores) ដែលចាប់សត្វដទៃស៊ី។"
      },
      {
        "questionKhmer": "តើស្ពៃក្តោប ឬទន្សាយស៊ីសត្វដទៃទេ?",
        "socraticPromptKhmer": "តើស្ពៃក្តោបជារុក្ខជាតិ និងទន្សាយជាសត្វស៊ីរុក្ខជាតិមែនទេ?",
        "hint1Khmer": "ស្ពៃក្តោប និងទន្សាយមិនស៊ីសត្វដទៃទេ។"
      },
      {
        "questionKhmer": "តើអក្សរណាដែលតំណាងឱ្យសត្វទីទុយ និងឥន្ទ្រី (B និង D)?",
        "socraticPromptKhmer": "តើជម្រើសត្រឹមត្រូវគឺ B និង D មែនទេ?",
        "hint1Khmer": "ចម្លើយគឺ B និង D (ឬ ខ និង ឃ)។"
      }
    ],
    "hintsKhmer": [
      "ទីទុយ (B) និង ឥន្ទ្រី (D) ជាសត្វស៊ីសាច់ដែលស៊ីសត្វដទៃជាអាហារ។"
    ],
    "explainKhmer": {
      "messageKhmer": "ទីទុយ (B) និងឥន្ទ្រី (D) គឺជាសត្វស៊ីសាច់ដែលចាប់សត្វដទៃស៊ីជាអាហារ។",
      "questionKhmer": "តើសត្វណាខ្លះជាសត្វស៊ីសាច់?"
    }
  },
  "science_p44_c_iii_consumers": {
    "statementKhmer": "តើភាវៈរស់ណាខ្លះជាអ្នកស៊ី (Consumers)?",
    "steps": [
      {
        "questionKhmer": "តើជម្រើសមួយណាជារុក្ខជាតិផលិតអាហារ (C)?",
        "socraticPromptKhmer": "តើស្ពៃក្តោប (C) ជាអ្នកផលិតតែមួយគត់មែនទេ?",
        "hint1Khmer": "ស្ពៃក្តោបជាអ្នកផលិត មិនមែនជាអ្នកស៊ីទេ។"
      },
      {
        "questionKhmer": "តើស្ពៃក្តោបបង្កើតអាហារដោយខ្លួនឯង ឬស៊ីភាវៈរស់ដទៃ?",
        "socraticPromptKhmer": "តើស្ពៃក្តោបបង្កើតអាហារដោយខ្លួនឯងមែនទេ?",
        "hint1Khmer": "រុក្ខជាតិបង្កើតអាហារដោយខ្លួនឯង។"
      },
      {
        "questionKhmer": "តើជម្រើសដែលនៅសល់ណាខ្លះជាសត្វ (អ្នកស៊ី)?",
        "socraticPromptKhmer": "តើសត្វទាំងអស់ (ទន្សាយ ទីទុយ ឥន្ទ្រី) សុទ្ធតែជាអ្នកស៊ីមែនទេ?",
        "hint1Khmer": "សត្វទាំងអស់ជាអ្នកស៊ី (Consumers)។"
      },
      {
        "questionKhmer": "តើអក្សរណាខ្លះតំណាងឱ្យសត្វទាំងនោះ (A, B, D)?",
        "socraticPromptKhmer": "តើចម្លើយគឺ A, B, D មែនទេ?",
        "hint1Khmer": "ចម្លើយត្រឹមត្រូវគឺ A, B, D (ឬ ក, ខ, ឃ)។"
      }
    ],
    "hintsKhmer": [
      "សត្វទាំងអស់ (A, B, D) គឺជាអ្នកស៊ី (Consumers)។"
    ],
    "explainKhmer": {
      "messageKhmer": "សត្វទន្សាយ (A), ទីទុយ (B) និងឥន្ទ្រី (D) គឺជាអ្នកស៊ី (Consumers) ព្រោះពួកវាមិនអាចបង្កើតអាហារដោយខ្លួនឯងបានទេ។",
      "questionKhmer": "តើភាវៈរស់ណាខ្លះជាអ្នកស៊ី?"
    }
  },
  "science_p44_d_producer_word": {
    "statementKhmer": "សរសេរពាក្យវិទ្យាសាស្ត្រមួយសម្រាប់ភាវៈរស់ដែលបង្កើតអាហារដោយខ្លួនឯង។",
    "steps": [
      {
        "questionKhmer": "តើភាវៈរស់ប្រភេទណាដែលអាចបង្កើតអាហារដោយខ្លួនឯង (រុក្ខជាតិ)?",
        "socraticPromptKhmer": "តើរុក្ខជាតិបៃតងអាចបង្កើតអាហារដោយខ្លួនឯងមែនទេ?",
        "hint1Khmer": "រុក្ខជាតិបៃតងប្រើពន្លឺព្រះអាទិត្យដើម្បីបង្កើតអាហារ។"
      },
      {
        "questionKhmer": "គិតអំពីពាក្យដែលយើងប្រើក្នុងខ្សែច្រវាក់អាហារសម្រាប់ភាវៈរស់ដែលបង្កើតអាហារ (អ្នកផលិត)។",
        "socraticPromptKhmer": "តើយើងហៅភាវៈរស់ដែលបង្កើតអាហារថាជា «អ្នកផលិត» មែនទេ?",
        "hint1Khmer": "ពាក្យក្នុងខ្សែច្រវាក់អាហារគឺ «អ្នកផលិត» (Producer)។"
      },
      {
        "questionKhmer": "តើពាក្យវិទ្យាសាស្ត្រសម្រាប់ភាវៈរស់ដែលបង្កើតអាហារដោយខ្លួនឯងគឺជាអ្វី (អ្នកផលិត / Producers)?",
        "socraticPromptKhmer": "តើពាក្យត្រឹមត្រូវគឺ «អ្នកផលិត» (Producers) មែនទេ?",
        "hint1Khmer": "ចម្លើយត្រឹមត្រូវគឺ «អ្នកផលិត» ឬ «Producers»។"
      }
    ],
    "hintsKhmer": [
      "ពាក្យវិទ្យាសាស្ត្រសម្រាប់ភាវៈរស់ដែលបង្កើតអាហារដោយខ្លួនឯងគឺ «អ្នកផលិត» (Producers)។"
    ],
    "explainKhmer": {
      "messageKhmer": "ពាក្យវិទ្យាសាស្ត្រសម្រាប់ភាវៈរស់ដែលបង្កើតអាហារដោយខ្លួនឯងគឺ «អ្នកផលិត» (Producers)។",
      "questionKhmer": "តើភាវៈរស់ដែលបង្កើតអាហារដោយខ្លួនឯងហៅថាអ្វី?"
    }
  }
};

/** Translation Cache in memory */
const memoryCache = new Map<string, string>();

export function getKhmerCaseData(caseId: string): CaseKhmerData | null {
  return HARDCODED_KHMER_TRANSLATIONS[caseId] || null;
}

export async function translateTextToKhmer(text: string): Promise<string> {
  if (!text || !text.trim()) return text;
  const trimmed = text.trim();

  if (memoryCache.has(trimmed)) {
    return memoryCache.get(trimmed)!;
  }

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: trimmed,
        target_lang: 'km',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const translated = data.translated_text || data.translated;
      if (translated && typeof translated === 'string') {
        memoryCache.set(trimmed, translated);
        return translated;
      }
    }
  } catch (err) {
    console.warn('Translate API unavailable, using fallback:', err);
  }

  return trimmed;
}