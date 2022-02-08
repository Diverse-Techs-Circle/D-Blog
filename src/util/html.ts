export function wrapOn(tag: keyof HTMLElementTagNameMap, child: string[], className?: string[], id?: string) {
    return [
        `<${tag}${className ? ` class="${className.join(' ')}"` : ''}${id ? ` id="${id}"` : ''}>`,
        ...child,
        `</${tag}>`,
    ].join('');
}
