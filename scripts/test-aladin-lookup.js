
require('dotenv').config({ path: '.env.local' });

const TTB_KEY = process.env.ALADIN_TTB_KEY;

async function testAladin() {
  // 1. Search First
  const searchUrl = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${TTB_KEY}&Query=안녕&QueryType=Title&MaxResults=1&start=1&SearchTarget=Book&output=js&Version=20131101`;
  console.log('1. Searching:', searchUrl);

  try {
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (searchData.errorCode) {
        console.error('Search Error:', searchData);
        return;
    }

    console.log('Search Result Count:', searchData.totalResults);
    
    if (searchData.item && searchData.item.length > 0) {
        const item = searchData.item[0];
        console.log('Found Book:', item.title, 'ISBN13:', item.isbn13);
        
        // 2. Lookup that specific ISBN
        const lookupUrl = `https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${TTB_KEY}&itemIdType=ISBN13&ItemId=${item.isbn13}&output=js&Version=20131101&OptResult=packing,ratingInfo,authors,reviewList,fileFormatList,mallType`;
        console.log('\n2. Looking up:', lookupUrl);
        
        const lookupRes = await fetch(lookupUrl);
        const lookupData = await lookupRes.json();
        console.log('Lookup Data keys:', Object.keys(lookupData.item[0]));
        console.log('Category:', lookupData.item[0].categoryName);
        console.log('Full Item:', JSON.stringify(lookupData.item[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAladin();
