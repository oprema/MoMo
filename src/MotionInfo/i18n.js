import i18next from 'i18next';

i18next
  .init({
    interpolation: {
      // React already does escaping
      escapeValue: false,
    },
    lng: 'en',
    // Using simple hardcoded resources for simple example
    resources: {
      de: {
        translation: {
          hello: 'Ein Huhu vor',
          state: 'Status',
          ok: 'Alles Ok',
          warn: 'Wo sind sie denn?',
          err: 'Keine Panik!',
          zh: 'Schlafenszeit',
          h: 'Std',
          m: 'Min',
          m6: 'mehr als 6 Std her'
        },
      },
      en: {
        translation: {
          hello: 'A Hello',
          state: 'State',
          ok: 'All ok',
          warn: 'Hmmm where are they?',
          err: 'No panic!',
          zh: 'Zhhhhhhhh',
          h: 'Hrs',
          m: 'Mins',
          m6: 'More than 6h ago',
          ago: 'ago',
        },
      },
    },
  });

  export default i18next;