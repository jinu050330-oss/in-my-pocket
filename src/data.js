export const asset = (frame, file) => `/figma/${frame}-${file}`;
const record = file => asset('547_1565', file + '.jpg');
const gallery = file => asset(1466, file + '.jpg');
const thumb = file => asset(1363, file + '.jpg');
const date = '2026-11-20';

export const people = [
  {id:'yena', name:'예나', color:'#dac0c1', cover:asset(1522,'c86aa.png'), total:19, hero:asset(1363,'923aa.png')},
  {id:'yumin', name:'윤민', color:'#eee5ae', cover:asset(1522,'8e44c.png'), total:10},
  {id:'jinwoo', name:'진우', color:'#cad6c1', cover:asset(1522,'9eee6.png'), total:3, linkedPhotos:['room','bike','sky']},
];

const photos = [
  ['coffee','커피',record('7220d')], ['dinner','함께 먹은 저녁',record('789cb')],
  ['park','공원 산책',record('8fc78')], ['trees','나무 그늘',record('0f4e2')],
  ['autumn','가을 단풍',gallery('d9e3e')], ['bike','자전거 길',gallery('113f2')],
  ['yellow','노란 옷',gallery('b70ff')], ['sky','공원 하늘',gallery('b233b')],
  ['walk','산책길',thumb('74967')], ['shop','옷 가게',gallery('2df54'),10,'b6112'],
  ['white','거울 앞에서',thumb('faddb'),11,'9f031'],
  ['cap','모자를 쓴 예나',thumb('c6641'),26,'923aa'],
  ['room','방에서',thumb('be31d')], ['door','유리문',gallery('1eaa8')],
  ['mirror','엘리베이터 거울',gallery('de6d3'),null,null,'yumin'],
  ['picnic','피크닉',gallery('f4b6c'),null,null,'yumin'],
  ['hood','후드 사진',asset(1118,'9e632.jpg'),2,'3933d'],
  ['donuts','도넛 상자',asset(1234,'c30d1.jpg'),13,'68557'],
  ['fruit','과일 접시',null,5,'15924'],
  ['skirt','검은 치마',null,15,'260e7'],
  ['cup','파란 컵',null,17,'635fb'],
  ['plate','함께 먹은 음식',null,24,'bb034'],
  ['dog','강아지',null,30,'bba77'],
];
export const seed = photos.map(([id,name,original,day,cutout,person='yena'])=>({
  id,name,original,person,date, calendarDate:day ? `2026-12-${String(day).padStart(2,'0')}` : null,
  cutout:cutout==='923aa' ? people[0].hero : cutout ? asset(1118,cutout+'.png') : null
}));
export const featured = ['walk','shop','white','cap','room','door'];
export const galleryLeft = [['shop',272],['bike',152],['picnic',272],['yellow',230]];
export const galleryRight = [['autumn',129],['mirror',230],['sky',130],['door',227]];
export const calendarArt = {
  2:[40,104,0,0],5:[48,53,0,26],10:[29,104,0,0],11:[42,104,0,0],
  13:[48,33,0,36],15:[48,104,0,0],17:[48,51,0,28],
  24:[47,45,0,29],26:[39,104,0,0],30:[48,50,0,27],
};
export const artwork = [
  ['ad74f',68,0,12,21],['4eea0',105,2,16,25],['ca898',117,148,34,35],
  ['1a95e',24,72,6,7],['0fb36',0,78,24,8],['2d0d2',137,98,12,5],['5b10f',140,109,47,4],
];
