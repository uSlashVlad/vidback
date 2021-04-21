export function genId(base: number) {
    return Math.floor((Math.random() + base) * 1000000) + 1;
}
