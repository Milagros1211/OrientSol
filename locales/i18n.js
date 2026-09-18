export async function loadLanguage(lang) {
    try {
        const response = await fetch(`./locales/${lang}.json`);
        return await response.json();
    } catch (error) {
        console.error("Error cargando el archivo de idioma", error);
    }
}

export function updateUIWithLanguage(dict) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.innerText = dict[key];
        }
    });
}