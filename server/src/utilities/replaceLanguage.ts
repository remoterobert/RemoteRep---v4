export default function replaceLanguage(
    language: { [k: string]: string },
    replace?: { [k: string]: string }
) {
    if (!replace) return language;

    return Object.fromEntries(
        Object.entries(language).map(([lk, lv]) => [
            lk,
            Object.entries(replace).reduce(
                (prev, [rk, rv]) => prev.replace(rk, rv),
                lv
            ),
        ])
    );
}
