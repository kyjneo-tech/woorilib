/**
 * Link Generators
 * Generates deep links and URLs for external book acquisition services
 */

export const linkGenerators = {
  /**
   * Daangn (당근마켓) - Used book marketplace
   */
  daangn: (keyword: string, regionName?: string) => {
    const searchTerms = regionName ? `${regionName} ${keyword}` : keyword;
    const encoded = encodeURIComponent(searchTerms);

    return {
      webUrl: `https://www.daangn.com/search/${encoded}`,
      searchQuery: searchTerms,
    };
  },

  /**
   * Yes24 - Used bookstore
   */
  yes24: (keyword: string) => {
    return `https://www.yes24.com/Product/Search/UsedStore?q=${encodeURIComponent(keyword)}`;
  },

  /**
   * Aladin - New/Used bookstore
   */
  aladinNew: (isbn: string) => {
    return `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${isbn}`;
  },

  aladinUsed: (isbn: string) => {
    return `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=UsedStore&SearchWord=${isbn}`;
  },

  /**
   * Naver Shopping - Price comparison
   */
  naverShopping: (isbn: string) => {
    return `https://search.shopping.naver.com/book/search?bookTabType=ALL&pageIndex=1&pageSize=40&query=${isbn}`;
  },

  /**
   * Coupang - New book purchase
   */
  coupang: (isbn: string) => {
    return `https://www.coupang.com/np/search?q=${isbn}&channel=relate`;
  },
};

export type DaangnLink = ReturnType<typeof linkGenerators.daangn>;
