// export interface Skin_mini {
//   _nsfw: boolean,
//   id: number,
//   name: string,
/*

0 - views
1 - downloads
2 - likes
3 - dislikes
4 - rating

*/
//   stats: number[],
//   creators: {
//     0: number[], // creators id
//     1: string[], // creators names
//     2: object[],
//   },
//   version: {
//     ind: number,
//     text: string,
//   },
//   size: {
//     0: number, // min size
//     1: number, // max size
//     2: string, // min - max size
//   },
//   modes: number[],
//   files: number[],
//   ratios: number[],
//   screenshots: [{
//      id: number,
//      mode: number,
//      name: string,
//      blob?: string,
//      gameplay: string,
//      user: {
//        id: number,
//        name: string,
//      },
//      created_at: string,
//      updated_at: string,
//  }],
//   keywords: string[],
//   since: number, // days ago
//   created_at: string,
//   updated_at: string,
// };


export const sortSkins = ((array, query, gamemode, sort, order, size, date, ratio) => {
  let result = [];
  if (typeof array == 'string') array = JSON.parse(array);


  // filter by gamode_id
  result = array.filter(r => r.modes.includes(parseInt(gamemode)));


  // filter by query
  if (query != '') {
    const _query = query.toLowerCase().split(' ');
    const nsfw = query.toLowerCase().includes('nsfw') || query.toLowerCase().includes('hentai') || query.toLowerCase().includes('erotic');

    const authors_keywords = _query.find(r => r.startsWith('authors:'));
    const ids = [];


    // define authors id's
    if (authors_keywords != null)
      authors_keywords.replace('authors:', '').split(',').filter(r => {
        if (isNaN(r)) return;
        ids.push(parseInt(r));
      });


    result = result.filter(r => {
      if (authors_keywords != null) {
        const is = ids.filter(d => r.creators[0].includes(d));
        return is.length > 0;
      };


      const by_name = _query.every(v => `${r.name} v${r.version.text}`.toLowerCase().includes(v));
      const by_authors = _query.every(v => r.creators[1].find(c => c.toLowerCase().includes(v)));
      const by_tags = _query.every(v => r.keywords.find(c => c.includes(v)));
      const by_nsfw = r._nsfw == true && nsfw == true;
      const by_skin_id = query.trim() == r.id;


      if (by_name || by_authors || by_tags || by_nsfw || by_skin_id) return true;
      return false;
    });
  };


  // filter by selected ratio
  if (ratio.is_active)
    result = result.filter(r => r.ratios.includes(parseInt(ratio.selected)));


  // filter by size range of the skin
  if (size.is_active)
    result = result.filter(r => {
      const s = r.size;

      if (s[0] >= size.min && s[1] <= size.max) return true;
      return false;
    });


  // filter by posted date
  if (date.is_active)
    result = result.filter(r => {
      const current = new Date(r.created_at);
      const min = new Date(date.min);
      const max = new Date(date.max);

      if (date.type == 0 && (current.getTime() > min.getTime() && current.getTime() < max.getTime())) return true;
      if (date.type == 1 && current.getTime() > min.getTime()) return true;
      if (date.type == 2 && current.getTime() < max.getTime()) return true;
      return false;
    });


  // apply sorting
  result.sort((a, b) => {
    if (sort == 1) {
      // Views
      if (order) return a.stats[0] - b.stats[0];
      return b.stats[0] - a.stats[0];
    };

    if (sort == 5) {
      // NAME
      if (order) return `${b.name} v${b.version.text}` > `${a.name} v${a.version.text}` ? 1 : -1;
      return `${a.name} v${a.version.text}` > `${b.name} v${b.version.text}` ? 1 : -1;
    };

    if (sort == 0) {
      // DOWNLOADS
      if (order) return a.stats[1] - b.stats[1];
      return b.stats[1] - a.stats[1];
    };

    if (sort == 2) {
      // RATINGS
      if (order) return a.stats[4] - b.stats[4];
      return b.stats[4] - a.stats[4];
    };

    if (sort == 3) {
      // SIZE
      if (order) return a.size[0] - b.size[0];
      return b.size[0] - a.size[0];
    };

    if (sort == 4) {
      // DATE
      if (order) return new Date(a.updated_at) - new Date(b.updated_at)
      return new Date(b.updated_at) - new Date(a.updated_at)
    };

    return a - b;
  });


  return result;
});
