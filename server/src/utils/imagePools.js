const { getPhotoIdPool } = require('./distinctFashionImages');

const globalUsedPhotoIds = new Set();

// Strictly category-isolated backup pools so NO cross-category image bleeding occurs!
const categoryBackupPools = {
  'Footwear': [
    'photo-1543163521-1bf539c55dd2', 'photo-1562273138-f46be4ebdf33', 'photo-1515347619252-60a4bf4fff4f',
    'photo-1596704017254-9b121068fb31', 'photo-1535043934128-cf0b28d52f95', 'photo-1542291026-7eec264c27ff',
    'photo-1608231387042-66d1773070a5', 'photo-1595950653106-6c9ebd614d3a', 'photo-1584735935682-2f2b69dff9d2',
    'photo-1614252235316-8c857d38b5f4', 'photo-1533867617858-e7b97e060509', 'photo-1549298916-b41d501d3772',
    'photo-1560769629-975ec94e6a86', 'photo-1595341888016-a392ef81b7de', 'photo-1588117305388-c2630a279f82',
    'photo-1512374382149-233c42b6a83b', 'photo-1579338559194-a162d19bf842', 'photo-1525966222134-fcfa99b8ae77',
    'photo-1560343776-97c7d202ff0e', 'photo-1600185365483-26d7a4cc7519',
  ],
  'Women': [
    'photo-1572804013309-59a88b7e92f1', 'photo-1595777457583-95e059d581b8', 'photo-1496747611176-843222e1e57c',
    'photo-1515372039744-b8f02a3ae446', 'photo-1539109136881-3be0616acf4b', 'photo-1503342217505-b0a15ec3261c',
    'photo-1598554747436-c9293d6a588f', 'photo-1485968579580-b6d095142e6e', 'photo-1583743814966-8936f5b7be1a', 'photo-1503341455253-b2e723bb3dbb', 'photo-1485218126466-34e63922604c',
    'photo-1516762689617-e1cffcef479d', 'photo-1550614000-4895a10e1bfd', 'photo-1541099649105-f69ad21f3246',
    'photo-1583496661160-fb5886a0aaaa', 'photo-1551854838-212c50b4c184', 'photo-1506629082925-23914a161f00',
    'photo-1582552938357-32b906df40cb', 'photo-1576995853123-5a10305d93c1', 'photo-1591195853828-11db59a44f6b',
    'photo-1517841905240-472988babdf9', 'photo-1583391733956-3750e0ff4e8a', 'photo-1610030469983-98e550d6193c',
    'photo-1617627143750-d86bc21e42bb', 'photo-1610030469984-98e550d6193d', 'photo-1609357605129-26f69add5d6e',
    'photo-1515886657613-9f3515b0c78f', 'photo-1529139574466-a303027c1d8b',
  ],
  'Men': [
    'photo-1529374255404-311a2a4f1fd9', 'photo-1562157873-818bc0726f68', 'photo-1581655353564-df123a1eb820',
    'photo-1578632767115-351597cf2477', 'photo-1625910513413-5acc23fb8381', 'photo-1602810318383-e386cc2a3ccf',
    'photo-1596755094514-f87e34085b2c', 'photo-1507679799987-c73779587ccf', 'photo-1620012253295-c15cc3e65df4',
    'photo-1598033129183-c4f50c736f10', 'photo-1473966968600-fa801b869a1a', 'photo-1542272604-780c96856592',
    'photo-1624378439575-d8705ad7ae80', 'photo-1517445312882-bc9910d016b7', 'photo-1492562080023-ab3db95bfbce',
    'photo-1552902865-b72c031ac5ea', 'photo-1556905055-8f358a7a47b2', 'photo-1544441893-675973e31985',
    'photo-1500648767791-00dcc994a43e', 'photo-1506794778202-cad84cf45f1d',
  ],
  'Jewellery': [
    'photo-1630019852942-f89202989a59', 'photo-1535632066927-ab7c9ab60908', 'photo-1599643477877-530eb83abc8e',
    'photo-1611591475777-233cd73be3df', 'photo-1635767798638-3665c302e27c', 'photo-1599643478518-a784e5dc4c8f',
    'photo-1573408301185-9146fe634ad0', 'photo-1605100804763-247f67b3557e', 'photo-1603561591411-07134e71a2a9',
    'photo-1598560917505-59a3ad559071', 'photo-1602751584552-8ba73aad10e1', 'photo-1588444837495-c6cfeb53f32d',
  ],
  'Accessories': [
    'photo-1584917865442-de89df76afd3', 'photo-1553062407-98eeb64c6a62', 'photo-1590874103328-eac38a683ce7',
    'photo-1566150905458-1bf1fc113f0d', 'photo-1548036328-c9fa89d128fa', 'photo-1591561954557-26941169b49e',
    'photo-1622560480605-d83c853bc5c3', 'photo-1511499767150-a48a237f0083', 'photo-1524805444758-089113d48a6d',
    'photo-1572635196237-14b3f281503f', 'photo-1508296695146-257a814070b4',
  ],
  'Beauty': [
    'photo-1586495777744-4413f21062fa', 'photo-1522337360788-8b13dee7a37e', 'photo-1596462502278-27bfdc403348',
    'photo-1617897903246-719242758050', 'photo-1541643600914-78b084683601', 'photo-1592945403244-b3fbafd7f539',
    'photo-1616949755610-8c9bbc08f138', 'photo-1523293182086-7651a899d37f', 'photo-1556228720-195a672e8a03',
    'photo-1570172619644-dfd03ed5d881', 'photo-1598440947619-2c35fc9aa908', 'photo-1608248597260-60b6165287f3',
    'photo-1535585209827-a15fcdbc4c2d', 'photo-1547887537-6158d64c35b4',
  ],
  'Kids': [
    'photo-1518831959646-742c3a14ebf7', 'photo-1519238263530-99bdd11df2ea', 'photo-1622290291468-a28f7a7dc6a8',
    'photo-1503944583220-79d8926ad5e2', 'photo-1519457431-44ccd64a579b', 'photo-1519238263530-99bdd11df2eb',
    'photo-1506152983158-b4a74a01c721', 'photo-1538805060514-97d9cc17730c', 'photo-1514989940723-e8e51635b782',
  ],
  'Sports & Activewear': [
    'photo-1517838277536-f5f99be501cd', 'photo-1483721310020-03333e577078', 'photo-1517438476312-10d79c077509',
    'photo-1506152983158-b4a74a01c723', 'photo-1518611012118-696072aa579a', 'photo-1571019613454-1cb2f99b2d8b',
    'photo-1552674605-db6ffd4facb5', 'photo-1588850561407-ed78c282e89b', 'photo-1508214751196-bcfd4ca60f91',
  ],
};

function getUniqueSubcategoryImage(category, subcategory, itemIndex) {
  const pool = getPhotoIdPool(category, subcategory);
  
  // 1. Check subcategory photo pool for an unused ID
  let chosenPhotoId = null;
  for (let idx = 0; idx < pool.length; idx++) {
    const candidateId = pool[(itemIndex + idx) % pool.length];
    if (!globalUsedPhotoIds.has(candidateId)) {
      chosenPhotoId = candidateId;
      break;
    }
  }

  // 2. If subcategory pool photo ID was already used, pick from this category's isolated backup pool!
  if (!chosenPhotoId) {
    const catPool = categoryBackupPools[category] || categoryBackupPools['Women'];
    for (let idx = 0; idx < catPool.length; idx++) {
      const candidateId = catPool[idx];
      if (!globalUsedPhotoIds.has(candidateId)) {
        chosenPhotoId = candidateId;
        break;
      }
    }
  }

  // 3. Fallback to index token if backup pool is exhausted
  if (!chosenPhotoId) {
    chosenPhotoId = pool[itemIndex % pool.length];
  }

  globalUsedPhotoIds.add(chosenPhotoId);

  const uniqueUrl = `https://images.unsplash.com/${chosenPhotoId}?w=600&auto=format&fit=crop`;
  return [uniqueUrl];
}

function clearUsedImages() {
  globalUsedPhotoIds.clear();
}

module.exports = {
  getUniqueSubcategoryImage,
  clearUsedImages,
  globalUsedPhotoIds,
};
