/**
 * Словари для подбора иконки на английском, японском и вьетнамском.
 * Русский словарь и сам подбор — в emojiSuggest.ts.
 */

export type Group =
  | 'dairy'
  | 'bakery'
  | 'meat'
  | 'fish'
  | 'fruit'
  | 'veg'
  | 'grain'
  | 'drink'
  | 'alcohol'
  | 'sweet'
  | 'snack'
  | 'sauce'
  | 'ready'
  | 'home'

/** [эмодзи, группа, ...слова]. Порядок внутри группы — порядок показа. */
export type Item = [emoji: string, group: Group, ...words: string[]]
/** Слова, которые называют группу целиком: «снеки», «фрукты». */
export type GroupWords = [group: Group, ...words: string[]]

/* Английский: слово в единственном числе — множественное находится само, а «strawberr»
   ловит и strawberry, и strawberries. Составные слова («cheesecake») перечислены явно.
   Запись с пробелом — словосочетание. */
export const EN_ITEMS: Item[] = [
  ['🥛', 'dairy', 'milk', 'kefir', 'cream', 'buttermilk'],
  ['🧀', 'dairy', 'cheese', 'mozzarella', 'parmesan', 'cheddar', 'feta', 'brie'],
  ['🧈', 'dairy', 'butter', 'margarine'],
  ['🥚', 'dairy', 'egg'],
  ['🥣', 'dairy', 'yogurt', 'yoghurt', 'sour cream', 'cottage cheese', 'curd', 'quark'],
  ['🍦', 'dairy', 'ice cream', 'icecream', 'gelato', 'popsicle'],

  ['🍞', 'bakery', 'bread', 'loaf', 'toast', 'bun'],
  ['🥖', 'bakery', 'baguette'],
  ['🥐', 'bakery', 'croissant', 'pastry', 'pastries'],
  ['🫓', 'bakery', 'pita', 'flatbread', 'tortilla', 'naan', 'lavash', 'wrap'],
  ['🥯', 'bakery', 'bagel'],
  ['🥞', 'bakery', 'pancake', 'crepe'],
  ['🧇', 'bakery', 'waffle'],
  ['🥧', 'bakery', 'pie'],

  ['🥩', 'meat', 'meat', 'meatball', 'beef', 'pork', 'steak', 'mince', 'lamb', 'veal'],
  ['🍗', 'meat', 'chicken', 'turkey', 'poultry', 'drumstick', 'wing'],
  ['🥓', 'meat', 'bacon', 'lard'],
  ['🌭', 'meat', 'sausage', 'hot dog', 'hotdog', 'salami', 'frankfurter', 'wiener'],
  ['🍖', 'meat', 'ham', 'rib', 'kebab'],

  ['🐟', 'fish', 'fish', 'salmon', 'trout', 'cod', 'herring', 'mackerel', 'tuna', 'pollock', 'tilapia'],
  ['🦐', 'fish', 'shrimp', 'prawn', 'seafood'],
  ['🦑', 'fish', 'squid', 'calamari', 'octopus'],
  ['🦀', 'fish', 'crab'],
  ['🍣', 'fish', 'sushi', 'sashimi'],
  ['🥫', 'fish', 'canned', 'tinned', 'sardine', 'sprat'],

  ['🍎', 'fruit', 'apple'],
  ['🍌', 'fruit', 'banana'],
  ['🍊', 'fruit', 'orange', 'tangerine', 'mandarin', 'clementine', 'grapefruit'],
  ['🍋', 'fruit', 'lemon', 'lime'],
  ['🍐', 'fruit', 'pear'],
  ['🍇', 'fruit', 'grape', 'raisin'],
  ['🍓', 'fruit', 'strawberr', 'raspberr'],
  ['🫐', 'fruit', 'blueberr', 'blackberr', 'cranberr', 'berry', 'berries', 'currant'],
  ['🍒', 'fruit', 'cherry', 'cherries'],
  ['🍑', 'fruit', 'peach', 'apricot', 'nectarine', 'plum'],
  ['🍉', 'fruit', 'watermelon'],
  ['🍈', 'fruit', 'melon', 'cantaloupe'],
  ['🍍', 'fruit', 'pineapple'],
  ['🥭', 'fruit', 'mango'],
  ['🥝', 'fruit', 'kiwi'],
  ['🥥', 'fruit', 'coconut'],

  ['🥔', 'veg', 'potato'],
  ['🥕', 'veg', 'carrot'],
  ['🍅', 'veg', 'tomato'],
  ['🥒', 'veg', 'cucumber', 'zucchini', 'courgette', 'pickle'],
  ['🧅', 'veg', 'onion', 'shallot', 'leek', 'scallion'],
  ['🧄', 'veg', 'garlic'],
  ['🫑', 'veg', 'pepper', 'paprika', 'capsicum', 'chili', 'chilli'],
  ['🥬', 'veg', 'cabbage', 'lettuce', 'greens', 'spinach', 'arugula', 'kale', 'dill', 'parsley', 'cilantro', 'coriander', 'herb'],
  ['🥦', 'veg', 'broccoli', 'cauliflower'],
  ['🌽', 'veg', 'corn', 'maize'],
  ['🍆', 'veg', 'eggplant', 'aubergine'],
  ['🥑', 'veg', 'avocado'],
  ['🍄', 'veg', 'mushroom', 'champignon'],
  ['🎃', 'veg', 'pumpkin', 'squash'],
  ['🫘', 'veg', 'bean', 'lentil', 'chickpea', 'peas'],

  ['🍚', 'grain', 'rice', 'buckwheat', 'bulgur', 'barley', 'millet', 'couscous', 'quinoa'],
  ['🍝', 'grain', 'pasta', 'spaghetti', 'macaroni', 'penne', 'fusilli'],
  ['🍜', 'grain', 'noodle', 'ramen', 'vermicelli'],
  ['🥣', 'grain', 'porridge', 'oatmeal', 'oats', 'cereal', 'muesli', 'granola', 'cornflake'],
  ['🌾', 'grain', 'flour', 'bran'],

  ['💧', 'drink', 'water'],
  ['🧃', 'drink', 'juice', 'compote', 'smoothie'],
  ['🥤', 'drink', 'soda', 'lemonade', 'cola', 'coke', 'drink', 'kvass'],
  ['☕', 'drink', 'coffee', 'espresso', 'capsule'],
  ['🍵', 'drink', 'tea', 'matcha'],
  ['🧋', 'drink', 'cocoa', 'milkshake', 'hot chocolate', 'bubble tea'],

  ['🍺', 'alcohol', 'beer', 'cider', 'lager'],
  ['🍷', 'alcohol', 'wine'],
  ['🥂', 'alcohol', 'champagne', 'sparkling', 'prosecco'],
  ['🥃', 'alcohol', 'whisky', 'whiskey', 'cognac', 'vodka', 'rum', 'brandy', 'tequila'],

  ['🍫', 'sweet', 'chocolate'],
  ['🍬', 'sweet', 'candy', 'candies', 'sweets', 'lollipop', 'caramel', 'sugar', 'marmalade', 'marshmallow', 'gummy', 'gummies'],
  ['🍪', 'sweet', 'cookie', 'biscuit', 'gingerbread'],
  ['🍯', 'sweet', 'honey', 'jam', 'syrup', 'condensed milk'],
  ['🍰', 'sweet', 'cake', 'cheesecake'],
  ['🧁', 'sweet', 'cupcake', 'muffin'],
  ['🍩', 'sweet', 'donut', 'doughnut'],
  ['🍮', 'sweet', 'pudding', 'custard', 'jelly'],

  ['🥨', 'snack', 'pretzel', 'cracker', 'rusk', 'crouton', 'breadstick', 'snack'],
  ['🍟', 'snack', 'chip', 'crisp', 'fries'],
  ['🥜', 'snack', 'nut', 'peanut', 'almond', 'pistachio', 'cashew', 'hazelnut', 'walnut', 'seed'],
  ['🍿', 'snack', 'popcorn'],
  ['🍘', 'snack', 'rice cake', 'crispbread'],

  ['🧂', 'sauce', 'salt', 'spice', 'seasoning'],
  ['🫒', 'sauce', 'olive', 'oil'],
  ['🍅', 'sauce', 'ketchup'],
  ['🥫', 'sauce', 'sauce', 'mayo', 'mayonnaise', 'mustard'],
  ['🍶', 'sauce', 'vinegar', 'soy sauce'],

  ['🥟', 'ready', 'dumpling', 'pelmeni', 'gyoza', 'ravioli', 'pierogi'],
  ['🍕', 'ready', 'pizza'],
  ['🍔', 'ready', 'burger', 'hamburger', 'patty', 'patties', 'cutlet'],
  ['🥪', 'ready', 'sandwich'],
  ['🍲', 'ready', 'soup', 'broth', 'stew', 'stock'],
  ['🥗', 'ready', 'salad'],
  ['🧊', 'ready', 'ice', 'frozen'],

  ['🧻', 'home', 'toilet paper', 'toilet roll', 'paper towel', 'kitchen roll', 'tissue', 'napkin'],
  ['🧼', 'home', 'soap'],
  ['🧴', 'home', 'shampoo', 'shower gel', 'lotion', 'conditioner', 'detergent', 'cleaner', 'dish soap'],
  ['🧽', 'home', 'sponge'],
  ['🪥', 'home', 'toothbrush', 'toothpaste'],
  ['🧺', 'home', 'laundry', 'washing powder', 'softener'],
  ['🗑️', 'home', 'trash bag', 'garbage bag', 'bin bag', 'bin liner'],
  ['🐈', 'home', 'cat food', 'pet food', 'dog food', 'litter'],
  ['👶', 'home', 'diaper', 'nappy', 'nappies', 'baby'],
  ['💊', 'home', 'medicine', 'pill', 'vitamin', 'tablet'],
  ['🔋', 'home', 'battery', 'batteries'],
  ['💡', 'home', 'bulb'],
]

export const EN_GROUPS: GroupWords[] = [
  ['dairy', 'dairy'],
  ['bakery', 'bakery', 'baked'],
  ['fruit', 'fruit'],
  ['veg', 'vegetable', 'veggie'],
  ['grain', 'grain', 'groceries'],
  ['drink', 'beverage'],
  ['alcohol', 'alcohol', 'liquor', 'booze'],
  ['sweet', 'sweets', 'dessert', 'treat'],
  ['snack', 'snack'],
  ['sauce', 'condiment'],
  ['ready', 'ready meal', 'frozen food'],
  ['home', 'household', 'cleaning', 'hygiene', 'toiletries'],
]

/* Японский: слова ищутся в любом месте названия — пробелов между словами нет.
   Катакана и хирагана считаются одним письмом, достаточно одного написания. */
export const JA_ITEMS: Item[] = [
  ['🥛', 'dairy', '牛乳', 'ぎゅうにゅう', 'ミルク', '豆乳', '生クリーム'],
  ['🧀', 'dairy', 'チーズ'],
  ['🧈', 'dairy', 'バター', 'マーガリン'],
  ['🥚', 'dairy', '卵', 'たまご', '玉子'],
  ['🥣', 'dairy', 'ヨーグルト'],
  ['🍦', 'dairy', 'アイス', 'ソフトクリーム'],

  ['🍞', 'bakery', 'パン', '食パン', 'トースト'],
  ['🥖', 'bakery', 'バゲット', 'フランスパン'],
  ['🥐', 'bakery', 'クロワッサン'],
  ['🫓', 'bakery', 'ナン', 'ピタ', 'トルティーヤ'],
  ['🥯', 'bakery', 'ベーグル'],
  ['🥞', 'bakery', 'パンケーキ', 'ホットケーキ'],
  ['🧇', 'bakery', 'ワッフル'],
  ['🥧', 'bakery', 'アップルパイ', 'パイ生地'],

  ['🥩', 'meat', '肉', '牛肉', '豚肉', 'ステーキ', 'ひき肉', 'ミンチ', 'ラム肉'],
  ['🍗', 'meat', '鶏', 'とり肉', 'チキン', 'ささみ', '手羽'],
  ['🥓', 'meat', 'ベーコン'],
  ['🌭', 'meat', 'ソーセージ', 'ウインナー', 'ウィンナー', 'サラミ'],
  ['🍖', 'meat', 'ハム', '焼肉', 'スペアリブ'],

  ['🐟', 'fish', '魚', 'さかな', '鮭', 'サーモン', 'さば', '鯖', 'まぐろ', 'ツナ', 'あじ', 'さんま', 'ぶり', 'たら', '刺身'],
  ['🦐', 'fish', 'えび', '海老', 'シーフード'],
  ['🦑', 'fish', 'いか', 'たこ'],
  ['🦀', 'fish', 'かに', '蟹'],
  ['🍣', 'fish', '寿司', 'すし', '鮨'],
  ['🥫', 'fish', '缶詰', 'ツナ缶', 'さば缶', '缶'],

  ['🍎', 'fruit', 'りんご', '林檎'],
  ['🍌', 'fruit', 'バナナ'],
  ['🍊', 'fruit', 'みかん', 'オレンジ', 'グレープフルーツ'],
  ['🍋', 'fruit', 'レモン', 'ライム'],
  ['🍐', 'fruit', '梨', '洋なし'],
  ['🍇', 'fruit', 'ぶどう', '葡萄', 'レーズン'],
  ['🍓', 'fruit', 'いちご', '苺'],
  ['🫐', 'fruit', 'ブルーベリー', 'ベリー'],
  ['🍒', 'fruit', 'さくらんぼ', 'チェリー'],
  ['🍑', 'fruit', '桃', 'ピーチ', 'あんず', 'プラム'],
  ['🍉', 'fruit', 'すいか', '西瓜'],
  ['🍈', 'fruit', 'メロン'],
  ['🍍', 'fruit', 'パイナップル', 'パイン'],
  ['🥭', 'fruit', 'マンゴー'],
  ['🥝', 'fruit', 'キウイ'],
  ['🥥', 'fruit', 'ココナッツ'],

  ['🥔', 'veg', 'じゃがいも', '芋', 'いも', 'ポテト'],
  ['🥕', 'veg', 'にんじん', '人参'],
  ['🍅', 'veg', 'トマト'],
  ['🥒', 'veg', 'きゅうり', '胡瓜', 'ズッキーニ'],
  ['🧅', 'veg', '玉ねぎ', 'たまねぎ', '玉葱', 'ねぎ', '葱'],
  ['🧄', 'veg', 'にんにく'],
  ['🫑', 'veg', 'ピーマン', 'パプリカ', '唐辛子'],
  ['🥬', 'veg', 'キャベツ', 'レタス', '白菜', 'ほうれん草', '小松菜', '水菜', '大葉', 'パセリ'],
  ['🥦', 'veg', 'ブロッコリー', 'カリフラワー'],
  ['🌽', 'veg', 'とうもろこし', 'コーン'],
  ['🍆', 'veg', 'なす', '茄子'],
  ['🥑', 'veg', 'アボカド'],
  ['🍄', 'veg', 'きのこ', 'しいたけ', '椎茸', 'しめじ', 'えのき', 'まいたけ', 'エリンギ', 'マッシュルーム'],
  ['🎃', 'veg', 'かぼちゃ', '南瓜'],
  ['🫘', 'veg', '豆', '大豆', '枝豆', '納豆', 'あずき'],

  ['🍚', 'grain', '米', 'お米', 'ご飯', 'ごはん', 'ライス', '玄米'],
  ['🍝', 'grain', 'パスタ', 'スパゲッティ', 'スパゲティ', 'マカロニ'],
  ['🍜', 'grain', 'ラーメン', 'うどん', 'そば', '蕎麦', 'そうめん', '麺'],
  ['🥣', 'grain', 'シリアル', 'オートミール', 'グラノーラ', 'コーンフレーク', 'おかゆ'],
  ['🌾', 'grain', '小麦粉', '薄力粉', '強力粉', '片栗粉'],

  ['💧', 'drink', '水', 'ミネラルウォーター', '炭酸水'],
  ['🧃', 'drink', 'ジュース'],
  ['🥤', 'drink', 'コーラ', 'ソーダ', 'サイダー', '炭酸', 'スポーツドリンク'],
  ['☕', 'drink', 'コーヒー', '珈琲'],
  ['🍵', 'drink', 'お茶', '緑茶', '麦茶', '紅茶', '抹茶', 'ほうじ茶', '茶'],
  ['🧋', 'drink', 'ココア', 'タピオカ'],

  ['🍺', 'alcohol', 'ビール', '発泡酒', 'チューハイ', 'サワー'],
  ['🍷', 'alcohol', 'ワイン'],
  ['🥂', 'alcohol', 'シャンパン', 'スパークリング'],
  ['🥃', 'alcohol', 'ウイスキー', 'ウィスキー', '焼酎', 'ブランデー'],
  ['🍶', 'alcohol', '日本酒', '酒'],

  ['🍫', 'sweet', 'チョコ'],
  ['🍬', 'sweet', '飴', 'キャンディ', '砂糖', 'グミ', 'マシュマロ'],
  ['🍪', 'sweet', 'クッキー', 'ビスケット'],
  ['🍯', 'sweet', 'はちみつ', '蜂蜜', 'ジャム', 'シロップ'],
  ['🍰', 'sweet', 'ケーキ'],
  ['🧁', 'sweet', 'マフィン', 'カップケーキ'],
  ['🍩', 'sweet', 'ドーナツ'],
  ['🍮', 'sweet', 'プリン', 'ゼリー'],

  ['🥨', 'snack', 'プレッツェル', 'クラッカー'],
  ['🍟', 'snack', 'ポテトチップス', 'ポテチ', 'チップス', 'フライドポテト'],
  ['🥜', 'snack', 'ナッツ', 'ピーナッツ', 'アーモンド', 'くるみ', '落花生'],
  ['🍿', 'snack', 'ポップコーン'],
  ['🍘', 'snack', 'せんべい', '煎餅', 'おかき'],

  ['🧂', 'sauce', '塩', 'こしょう', '胡椒', 'スパイス'],
  ['🫒', 'sauce', 'オリーブ', 'サラダ油', 'ごま油', '油'],
  ['🍅', 'sauce', 'ケチャップ'],
  ['🥫', 'sauce', 'ソース', 'マヨネーズ', 'マスタード', 'からし', 'ドレッシング', 'めんつゆ', '味噌', 'みそ'],
  ['🍶', 'sauce', '醤油', 'しょうゆ', 'みりん', '料理酒', 'ポン酢', '酢'],

  ['🥟', 'ready', '餃子', 'ぎょうざ', 'シュウマイ', '焼売'],
  ['🍕', 'ready', 'ピザ'],
  ['🍔', 'ready', 'ハンバーガー', 'ハンバーグ', 'バーガー'],
  ['🥪', 'ready', 'サンドイッチ'],
  ['🍙', 'ready', 'おにぎり', 'おむすび'],
  ['🍱', 'ready', '弁当'],
  ['🍲', 'ready', 'スープ', '味噌汁', 'みそ汁', '鍋', 'カレー', 'シチュー', 'だし'],
  ['🥗', 'ready', 'サラダ'],
  ['🧊', 'ready', '氷', '冷凍'],

  ['🧻', 'home', 'トイレットペーパー', 'ティッシュ', 'キッチンペーパー'],
  ['🧼', 'home', '石鹸', '石けん', 'せっけん', 'ハンドソープ'],
  ['🧴', 'home', 'シャンプー', 'リンス', 'コンディショナー', 'ボディソープ', '洗剤', '化粧水'],
  ['🧽', 'home', 'スポンジ'],
  ['🪥', 'home', '歯ブラシ', '歯磨き', 'はみがき'],
  ['🧺', 'home', '洗濯', '柔軟剤'],
  ['🗑️', 'home', 'ゴミ袋', 'ポリ袋'],
  ['🐈', 'home', 'キャットフード', 'ペットフード', 'ドッグフード', '猫砂', '猫'],
  ['👶', 'home', 'おむつ', 'ベビー'],
  ['💊', 'home', '薬', 'ビタミン', 'サプリ'],
  ['🔋', 'home', '電池'],
  ['💡', 'home', '電球'],
]

export const JA_GROUPS: GroupWords[] = [
  ['dairy', '乳製品'],
  ['bakery', 'ベーカリー'],
  ['meat', '精肉'],
  ['fish', '魚介', '鮮魚'],
  ['fruit', '果物', 'くだもの', 'フルーツ'],
  ['veg', '野菜', 'やさい'],
  ['grain', '穀物', '主食'],
  ['drink', '飲み物', '飲料', 'ドリンク'],
  ['alcohol', 'お酒', 'アルコール'],
  ['sweet', 'お菓子', 'スイーツ', 'デザート', 'おやつ'],
  ['snack', 'スナック', 'おつまみ'],
  ['sauce', '調味料'],
  ['ready', '冷凍食品', '惣菜'],
  ['home', '日用品', '掃除'],
]

/* Вьетнамский: слова не склоняются, поэтому совпадать должно слово или словосочетание
   целиком: «sữa chua» — йогурт, а не молоко. */
export const VI_ITEMS: Item[] = [
  ['🥛', 'dairy', 'sữa', 'sữa tươi', 'kem tươi'],
  ['🧀', 'dairy', 'phô mai', 'pho mát', 'phô mát'],
  ['🧈', 'dairy', 'bơ', 'bơ thực vật'],
  ['🥚', 'dairy', 'trứng', 'trứng gà', 'trứng vịt'],
  ['🥣', 'dairy', 'sữa chua', 'yaourt', 'da ua'],
  ['🍦', 'dairy', 'kem', 'cà rem'],

  ['🍞', 'bakery', 'bánh mì', 'bánh mỳ'],
  ['🥖', 'bakery', 'baguette'],
  ['🥐', 'bakery', 'bánh sừng bò', 'croissant'],
  ['🥞', 'bakery', 'bánh kếp', 'pancake'],

  ['🥩', 'meat', 'thịt', 'thịt bò', 'thịt heo', 'thịt lợn', 'thịt xay', 'bò', 'heo', 'bít tết'],
  ['🍗', 'meat', 'gà', 'thịt gà', 'ức gà', 'đùi gà', 'cánh gà', 'vịt'],
  ['🥓', 'meat', 'thịt xông khói', 'ba chỉ', 'ba rọi'],
  ['🌭', 'meat', 'xúc xích', 'lạp xưởng'],
  ['🍖', 'meat', 'giò', 'chả', 'chả lụa', 'giò lụa', 'sườn', 'thịt nguội', 'dăm bông'],

  ['🐟', 'fish', 'cá', 'cá hồi', 'cá thu', 'cá ngừ', 'cá basa'],
  ['🦐', 'fish', 'tôm', 'hải sản'],
  ['🦑', 'fish', 'mực', 'bạch tuộc'],
  ['🦀', 'fish', 'cua', 'ghẹ'],
  ['🍣', 'fish', 'sushi'],
  ['🥫', 'fish', 'đồ hộp', 'cá hộp', 'pate'],

  ['🍎', 'fruit', 'táo'],
  ['🍌', 'fruit', 'chuối'],
  ['🍊', 'fruit', 'cam', 'quýt', 'bưởi'],
  ['🍋', 'fruit', 'chanh'],
  ['🍐', 'fruit', 'lê'],
  ['🍇', 'fruit', 'nho'],
  ['🍓', 'fruit', 'dâu', 'dâu tây'],
  ['🫐', 'fruit', 'việt quất'],
  ['🍒', 'fruit', 'anh đào', 'cherry'],
  ['🍑', 'fruit', 'đào', 'mận', 'mơ'],
  ['🍉', 'fruit', 'dưa hấu'],
  ['🍈', 'fruit', 'dưa lưới', 'dưa gang'],
  ['🍍', 'fruit', 'dứa', 'thơm', 'khóm'],
  ['🥭', 'fruit', 'xoài'],
  ['🥝', 'fruit', 'kiwi'],
  ['🥥', 'fruit', 'dừa'],

  ['🥔', 'veg', 'khoai tây', 'khoai lang', 'khoai'],
  ['🥕', 'veg', 'cà rốt'],
  ['🍅', 'veg', 'cà chua'],
  ['🥒', 'veg', 'dưa chuột', 'dưa leo', 'bí ngòi'],
  ['🧅', 'veg', 'hành', 'hành tây', 'hành lá', 'hành tím'],
  ['🧄', 'veg', 'tỏi'],
  ['🫑', 'veg', 'ớt', 'ớt chuông'],
  ['🥬', 'veg', 'rau', 'bắp cải', 'cải', 'cải thảo', 'xà lách', 'rau muống', 'rau thơm', 'ngò', 'húng'],
  ['🥦', 'veg', 'bông cải', 'súp lơ'],
  ['🌽', 'veg', 'ngô', 'bắp'],
  ['🍆', 'veg', 'cà tím'],
  ['🥑', 'veg', 'quả bơ', 'trái bơ'],
  ['🍄', 'veg', 'nấm'],
  ['🎃', 'veg', 'bí đỏ', 'bí ngô', 'bí'],
  ['🫘', 'veg', 'đậu', 'đỗ', 'đậu phụ', 'đậu hũ', 'đậu xanh', 'đậu đen'],

  ['🍚', 'grain', 'gạo', 'cơm', 'gạo nếp', 'nếp'],
  ['🍝', 'grain', 'mì ý', 'nui', 'pasta', 'spaghetti'],
  ['🍜', 'grain', 'mì', 'mì gói', 'mì tôm', 'phở', 'bún', 'miến', 'hủ tiếu', 'bánh phở'],
  ['🥣', 'grain', 'ngũ cốc', 'yến mạch', 'cháo'],
  ['🌾', 'grain', 'bột mì', 'bột'],

  ['💧', 'drink', 'nước', 'nước lọc', 'nước suối', 'nước khoáng'],
  ['🧃', 'drink', 'nước ép', 'nước trái cây', 'sinh tố'],
  ['🥤', 'drink', 'nước ngọt', 'nước tăng lực', 'coca', 'pepsi', 'soda'],
  ['☕', 'drink', 'cà phê', 'cafe'],
  ['🍵', 'drink', 'trà', 'chè'],
  ['🧋', 'drink', 'trà sữa', 'ca cao', 'cacao'],

  ['🍺', 'alcohol', 'bia'],
  ['🍷', 'alcohol', 'rượu vang', 'vang'],
  ['🥂', 'alcohol', 'sâm panh'],
  ['🥃', 'alcohol', 'rượu', 'whisky', 'vodka'],

  ['🍫', 'sweet', 'sô cô la', 'socola', 'sôcôla', 'chocolate'],
  ['🍬', 'sweet', 'kẹo', 'kẹo dẻo', 'đường'],
  ['🍪', 'sweet', 'bánh quy', 'bánh qui'],
  ['🍯', 'sweet', 'mật ong', 'mứt', 'sữa đặc', 'siro'],
  ['🍰', 'sweet', 'bánh ngọt', 'bánh kem', 'bánh bông lan', 'bánh'],
  ['🍩', 'sweet', 'bánh donut', 'donut'],
  ['🍮', 'sweet', 'bánh flan', 'flan', 'thạch', 'rau câu', 'pudding'],

  ['🍟', 'snack', 'khoai tây chiên', 'bim bim', 'snack'],
  ['🥜', 'snack', 'hạt', 'đậu phộng', 'lạc', 'hạnh nhân', 'hạt điều', 'hạt dẻ', 'óc chó', 'hạt hướng dương'],
  ['🍿', 'snack', 'bắp rang', 'bỏng ngô'],
  ['🍘', 'snack', 'bánh gạo', 'bánh tráng'],

  ['🧂', 'sauce', 'muối', 'tiêu', 'hạt nêm', 'bột ngọt', 'mì chính', 'bột canh'],
  ['🫒', 'sauce', 'dầu ô liu', 'ô liu', 'dầu ăn', 'dầu'],
  ['🍅', 'sauce', 'tương cà'],
  ['🥫', 'sauce', 'nước mắm', 'tương ớt', 'mayonnaise', 'sốt', 'mù tạt', 'tương', 'mắm', 'dầu hào'],
  ['🍶', 'sauce', 'nước tương', 'xì dầu', 'giấm', 'dấm'],

  ['🥟', 'ready', 'há cảo', 'sủi cảo', 'bánh bao', 'hoành thánh'],
  ['🍕', 'ready', 'pizza'],
  ['🍔', 'ready', 'hamburger', 'burger'],
  ['🥪', 'ready', 'sandwich', 'bánh mì kẹp'],
  ['🍲', 'ready', 'canh', 'súp', 'lẩu', 'nước dùng'],
  ['🥗', 'ready', 'salad', 'gỏi', 'nộm'],
  ['🧊', 'ready', 'đá', 'đá viên', 'đông lạnh'],

  ['🧻', 'home', 'giấy vệ sinh', 'khăn giấy', 'giấy ăn', 'giấy'],
  ['🧼', 'home', 'xà phòng', 'xà bông'],
  ['🧴', 'home', 'dầu gội', 'sữa tắm', 'dầu xả', 'nước rửa chén', 'nước rửa bát', 'nước rửa tay', 'sữa rửa mặt', 'kem dưỡng', 'nước lau nhà'],
  ['🧽', 'home', 'miếng rửa chén', 'mút rửa bát', 'bọt biển'],
  ['🪥', 'home', 'bàn chải', 'kem đánh răng'],
  ['🧺', 'home', 'bột giặt', 'nước giặt', 'nước xả', 'nước xả vải'],
  ['🗑️', 'home', 'túi rác', 'bao rác', 'túi nilon'],
  ['🐈', 'home', 'thức ăn mèo', 'hạt mèo', 'cát mèo', 'thức ăn chó'],
  ['👶', 'home', 'tã', 'bỉm', 'sữa bột'],
  ['💊', 'home', 'thuốc', 'vitamin'],
  ['🔋', 'home', 'pin'],
  ['💡', 'home', 'bóng đèn'],
]

export const VI_GROUPS: GroupWords[] = [
  ['fruit', 'trái cây', 'hoa quả'],
  ['veg', 'rau củ', 'rau củ quả'],
  ['drink', 'đồ uống', 'nước uống', 'thức uống'],
  ['alcohol', 'rượu bia'],
  ['sweet', 'bánh kẹo', 'đồ ngọt', 'tráng miệng'],
  ['snack', 'đồ ăn vặt', 'ăn vặt'],
  ['sauce', 'gia vị', 'nước chấm'],
  ['ready', 'đồ đông lạnh', 'đồ ăn sẵn'],
  ['home', 'đồ gia dụng', 'đồ dùng', 'vệ sinh'],
]
