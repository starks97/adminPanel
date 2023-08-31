export default class SlugGenerator {
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
}
