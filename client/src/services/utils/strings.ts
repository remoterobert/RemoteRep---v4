export function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatAsterisks(text: string) {
    // Replace three asterisks with bold and italic
    text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<b><i>$1</i></b>');

    // Replace two asterisks with bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

    // Replace single asterisks with italic
    text = text.replace(/\*([^*]+)\*/g, '<i>$1</i>');

    return text;
}

export function replaceUrlsWithLinks(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(
        urlRegex,
        '<a href="$&" target="_blank" class="hover:underline"><b>$&</b></a>'
    );
}
