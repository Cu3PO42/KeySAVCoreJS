function trimCString(str: string) {
    var index = str.indexOf('\0');
    if (index < 0)
        return str;
    return str.substr(0, index);
}

var specialCharMap: { [char: string]: string } = {
    "\ue095": "⊙",
    "\ue096": "○",
    "\ue097": "□",
    "\ue098": "△",
    "\ue099": "♢",
    "\ue090": "♠",
    "\ue092": "♥",
    "\ue093": "♦",
    "\ue091": "♣",
    "\ue094": "★",
    "\ue09a": "♪",
    "\ue09b": "☀",
    "\ue09c": "⛅",
    "\ue09d": "☂",
    "\ue09e": "⛄",
    "\ue09f": "😐",
    "\ue0a0": "😊",
    "\ue0a1": "😫",
    "\ue0a2": "😤",
    "\ue0a5": "💤",
    "\ue0a3": "⤴",
    "\ue0a4": "⤵",
    "\ue08e": "♂",
    "\ue08f": "♀",
    "\ue08d": "…"
};
var chsOffset = 0xE800;
var chsCharacterMap = "蛋妙蛙种子草花小火龙恐喷杰尼龟卡咪水箭绿毛虫铁甲蛹巴大蝶独角壳针蜂波比鸟拉达烈雀嘴阿柏蛇怪皮丘雷穿山鼠王多兰娜后朗力诺可西六尾九胖丁超音蝠走路臭霸派斯特球摩鲁蛾地三喵猫老鸭哥猴暴蒂狗风速蚊香蝌蚪君泳士凯勇基胡腕豪喇叭芽口呆食玛瑙母毒刺拳石隆岩马焰兽磁合一葱嘟利海狮白泥舌贝鬼通耿催眠貘引梦人钳蟹巨霹雳电顽弹椰树嘎啦飞腿郎快头瓦双犀牛钻吉蔓藤袋墨金鱼星宝魔墙偶天螳螂迷唇姐击罗肯泰鲤普百变伊布边菊化盔镰刀翼急冻闪你哈克幻叶月桂竺葵锯鳄蓝立咕夜鹰芭瓢安圆丝蛛叉字灯笼古然咩羊茸美丽露才皇毽棉长手向日蜻蜓乌沼太阳亮黑暗鸦妖未知图腾果翁麒麟奇榛佛托土弟蝎钢千壶赫狃熊圈熔蜗猪珊瑚炮章桶信使翅戴加象顿Ⅱ惊鹿犬无畏战舞娃奶罐幸福公炎帝幼沙班洛亚凤时木守宫森林蜥蜴稚鸡壮跃狼纹直冲茧狩猎盾粉莲童帽乐河橡实鼻狡猾傲骨燕鸥莉奈朵溜糖雨蘑菇斗笠懒獭过动猿请假居忍面者脱妞吼爆幕下掌朝北优雅勾魂眼那恰姆落正拍负萤甜蔷薇溶吞牙鲨鲸驼煤炭跳噗晃斑颚蚁漠仙歌青绵七夕鼬斩饭匙鳅鲶虾兵螯秤念触摇篮羽丑纳飘浮泡隐怨影诅咒巡灵彷徨热带铃勃梭雪冰护豹珍珠樱空棘爱心哑属艾欧盖固坐祈代希苗台猛曼拿儿狸法师箱蟀勒伦琴含羞苞槌城结贵妇绅蜜女帕兹潜兔随卷耳魅东施铛响坦铜镜钟盆聒噪陆尖咬不良骷荧光霓虹自舔狂远Ｚ由卢席恩骑色霏莱谢米尔宙提主暖炒武刃丸剑探步哨约扒酷冷蚀豆鸽高雉幔庞滚蝙螺钉差搬运匠修建蟾蜍投摔打包保足蜈蚣车轮精根裙野蛮鲈混流氓红倒狒殿滑巾征哭具死神棺原肋始祖破灰尘索沫栗德单卵细胞造鹅倍四季萌哎呀败轻蜘坚齿组麻鳗宇烛幽晶斧嚏几何敏捷功夫父赤驹劈司令炸雄秃丫首恶燃烧毕云酋迪耶塔赛里狐呱贺掘彩蓓洁能鞘芳芙妮好鱿贼脚铠垃藻臂枪伞咚碎黏钥朽南瓜嗡哲裴格枭狙射炽咆哮虎漾壬笃啄铳少强锹农胜虻鬃弱坏驴仔重挽滴伪睡罩盗着竹疗环智挥猩掷胆噬堡爷参性：银伴陨枕戈谜拟Ｑ磨舵鳞杖璞・鸣哞鳍科莫迦虚吾肌费束辉纸御机夏";
var chtOffset = 0xEB0F;
var chtCharacterMap = "蛋妙蛙種子草花小火龍恐噴傑尼龜卡咪水箭綠毛蟲鐵甲蛹巴大蝶獨角殼針蜂波比鳥拉達烈雀嘴阿柏蛇怪皮丘雷穿山鼠王多蘭娜后朗力諾可西六尾九胖丁超音蝠走路臭霸派斯特球摩魯蛾地三喵貓老鴨哥猴爆蒂狗風速蚊香蝌蚪君泳士凱勇基胡腕豪喇叭芽口呆食瑪瑙母毒刺拳石隆岩馬焰獸磁合一蔥嘟利海獅白泥舌貝鬼通耿催眠貘引夢人鉗蟹巨霹靂電頑彈椰樹嘎啦飛腿郎快頭瓦雙犀牛鑽吉蔓藤袋墨金魚星寶魔牆偶天螳螂迷唇姐擊羅肯泰鯉暴普百變伊布邊菊化盔鐮刀翼急凍閃你哈克幻葉月桂竺葵鋸鱷藍立咕夜鷹芭瓢安圓絲蛛叉字燈籠古然咩羊茸美麗露才皇毽棉長手向日蜻蜓烏沼太陽亮黑暗鴉妖未知圖騰果翁麒麟奇榛佛托土弟蠍鋼千壺赫狃熊圈熔蝸豬珊瑚炮章桶信使翅戴加象頓Ⅱ驚鹿犬無畏戰舞娃奶罐幸福公炎帝幼沙班洛亞鳳時木守宮森林蜥蜴稚雞壯躍狼紋直衝繭狩獵盾粉蓮童帽樂河橡實鼻狡猾傲骨燕鷗莉奈朵溜糖雨蘑菇斗笠懶獺過動猿請假居忍面者脫妞吼幕下掌朝北優雅勾魂眼那恰姆落正拍負螢甜薔薇溶吞牙鯊鯨駝煤炭跳噗晃斑顎蟻漠仙歌青綿七夕鼬斬飯匙鰍鯰蝦兵螯秤念觸搖籃羽醜納飄浮泡隱怨影詛咒巡靈彷徨熱帶鈴勃梭雪冰護豹珍珠櫻空棘愛心啞屬艾歐蓋固坐祈代希苗台猛曼拿兒狸法師箱蟀勒倫琴含羞苞槌城結貴婦紳蜜女帕茲潛兔隨捲耳魅東施鐺響坦銅鏡鐘盆聒噪陸尖咬不良骷光霓虹自舔狂遠Ｚ由盧席恩騎色霏萊謝米爾宙提主暖炒武刃丸劍探步哨約扒酷冷蝕豆鴿高雉幔龐滾蝙螺釘差搬運匠修建蟾蜍投摔打包保足蜈蚣車輪毬精根裙野蠻鱸混流氓紅倒狒殿滑巾徵哭具死神棺原肋始祖破灰塵索沫栗德單卵細胞造鵝倍四季萌哎呀敗輕蜘堅齒組麻鰻宇燭幽晶斧嚏幾何敏捷功夫父赤駒劈司令炸雄禿丫首惡燃燒畢雲酋迪耶塔賽里狐呱賀掘彩蓓潔能鞘芳芙妮好魷賊腳鎧垃藻臂槍傘咚碎黏鑰朽南瓜嗡哲裴格梟狙射熾咆哮虎漾壬篤啄銃少強鍬農勝虻鬃弱壞驢仔重挽滴偽睡罩盜著竹療環智揮猩擲膽噬堡爺參性：銀伴隕枕戈謎擬Ｑ磨舵鱗杖璞・鳴哞鰭科莫迦虛吾肌費束輝紙御機夏";

for (let i = 0; i < chsCharacterMap.length; ++i) specialCharMap[String.fromCharCode(chsOffset + i)] = chsCharacterMap[i]; 
for (let i = 0; i < chtCharacterMap.length; ++i) specialCharMap[String.fromCharCode(chtOffset + i)] = chtCharacterMap[i]; 

var specialCharMapReverse: { [char: string]: string } = {};

for (let key in specialCharMap) {
    if (specialCharMap.hasOwnProperty(key)) {
        specialCharMapReverse[specialCharMap[key]] = key;
    }
}

export function decodeUnicode16LE(arr: Uint8Array, offset: number, length: number): string {
    let res = '';
    const end = offset + length;
    for (let i = offset; i < end; i += 2) {
      res += String.fromCharCode(arr[i] | (arr[i + 1] << 8));
    }
    return trimCString(res.replace(/./g, function(m) {
        return specialCharMap[m] || m;
    }));
}

export function encodeUnicode16LE(str: string): Uint8Array {
    const patchedString = str.replace(/./g, function(m) {
        return specialCharMapReverse[m] || m;
    });
    const byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      const c = patchedString.charCodeAt(i);
      const hi = c >> 8;
      const lo = c & 0xFF;
      byteArray.push(lo);
      byteArray.push(hi);
    }
  
    return new Uint8Array(byteArray);
}

export function createDataView(arr): DataView {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}

export function createBuffer(arr: Uint8Array | Uint16Array |  Uint32Array): Buffer {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
}

export function createUint8Array(arr): Uint8Array {
    return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}

export function createUint16Array(arr): Uint16Array {
    if ((arr.byteLength & 1) !== 0)
        throw new Error("Array not aligned to 2-byte words.");
    return new Uint16Array(arr.buffer, arr.byteOffset, arr.byteLength >> 1);
}

export function createUint32Array(arr): Uint32Array {
    if ((arr.byteLength & 3) !== 0)
        throw new Error("Array not aligned to 4-byte words.");
    return new Uint32Array(arr.buffer, arr.byteOffset, arr.byteLength >> 2);
}

export function copy(src: Uint8Array, off1: number, dest: Uint8Array, off2: number, length: number) {
    var totalOffset1 = off1 + src.byteOffset;
    var totalOffset2 = off2 + dest.byteOffset;
    var lower4Bound = Math.min(-totalOffset1 & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (((totalOffset1 - totalOffset2) & 3) !== 0 || lower4Bound >= upper4Bound) {
        for (var i = 0; i < length; ++i) {
            dest[i + off2] = src[i + off1];
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            dest[i + off2] = src[i + off1];
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var src_32 = new Uint32Array(src.buffer, totalOffset1 + lower4Bound, intermediate4Length);
        var dest_32 = new Uint32Array(dest.buffer, totalOffset2 + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            dest_32[i] = src_32[i];
        }
        for (var i = upper4Bound; i < length; ++i) {
            dest[i + off2] = src[i + off1];
        }
    }
}

export function xor(src1: Uint8Array, src2: Uint8Array): Uint8Array;
export function xor(src1: Uint8Array, src2: Uint8Array, length: number): Uint8Array;
export function xor(src1: Uint8Array, off1: number, src2: Uint8Array, off2: number, len: number): Uint8Array;
export function xor(src1: Uint8Array, off1: number, src2: Uint8Array, off2: number, dest: Uint8Array, off3: number, len: number): void;
export function xor(src1: Uint8Array, b, c?, d?, e?, f?, g?): any {
    var off1: number, src2: Uint8Array, off2: number, length: number, dest: Uint8Array, off3: number;
    if (b instanceof Uint8Array) {
        src2 = b;
        off1 = 0;
        if (Number.isInteger(c)) {
            off2 = c;
        } else {
            off2 = 0;
        }
        length = src1.length;
        dest = new Uint8Array(length);
        off3 = 0;
    } else {
        off1 = b;
        src2 = c;
        off2 = d;
        if (e instanceof Uint8Array) {
            dest = e;
            off3 = f;
            length = g;
        } else {
            length = e;
            dest = new Uint8Array(length);
            off3 = 0;
        }
    }

    var totalOffset1 = off1 + src1.byteOffset;
    var totalOffset2 = off2 + src2.byteOffset;
    var totalOffset3 = off3 + dest.byteOffset;
    var lower4Bound = Math.min(-totalOffset1 & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (((totalOffset1 - totalOffset2) & 3) !== 0 ||
        ((totalOffset1 - totalOffset3) & 3) !== 0 || lower4Bound >= upper4Bound) {
        for (var i = 0; i < length; ++i) {
            dest[i+off3] = src1[i+off1] ^ src2[i+off2];
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            dest[i+off3] = src1[i+off1] ^ src2[i+off2];
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var src1_32 = new Uint32Array(src1.buffer, totalOffset1 + lower4Bound, intermediate4Length);
        var src2_32 = new Uint32Array(src2.buffer, totalOffset2 + lower4Bound, intermediate4Length);
        var dest_32 = new Uint32Array(dest.buffer, totalOffset3 + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            dest_32[i] = src1_32[i] ^ src2_32[i];
        }
        for (var i = upper4Bound; i < length; ++i) {
            dest[i+off3] = src1[i+off1] ^ src2[i+off2];
        }
    }

    if (g === undefined)
        return dest;
}

export function xorThree(src1: Uint8Array, off1: number, src2: Uint8Array, off2: number, src3: Uint8Array, off3: number, length: number): Uint8Array {
    var totalOffset1 = off1 + src1.byteOffset;
    var totalOffset2 = off2 + src2.byteOffset;
    var totalOffset3 = off3 + src3.byteOffset;
    var lower4Bound = Math.min(-totalOffset1 & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (((totalOffset1 - totalOffset2) & 3) !== 0 ||
        ((totalOffset1 - totalOffset3) & 3) !== 0 || lower4Bound >= upper4Bound) {
        var dest = new Uint8Array(length);
        for (var i = 0; i < length; ++i) {
            dest[i] = src1[i+off1] ^ src2[i+off2] ^ src3[i+off3];
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            dest[i] = src1[i+off1] ^ src2[i+off2] ^ src3[i+off3];
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var dest = new Uint8Array(length + lower4Bound).subarray(lower4Bound); // do this so the destination array is on the same 4-byte alignment
        var src1_32 = new Uint32Array(src1.buffer, totalOffset1 + lower4Bound, intermediate4Length);
        var src2_32 = new Uint32Array(src2.buffer, totalOffset2 + lower4Bound, intermediate4Length);
        var src3_32 = new Uint32Array(src3.buffer, totalOffset3 + lower4Bound, intermediate4Length);
        var dest_32 = new Uint32Array(dest.buffer, dest.byteOffset + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            dest_32[i] = src1_32[i+off1] ^ src2_32[i+off2] ^ src3_32[i+off3];
        }
        for (var i = lower4Bound; i < length; ++i) {
            dest[i] = src1[i+off1] ^ src2[i+off2] ^ src3[i+off3];
        }
    }
    return dest;
}

export function xorInPlace(dest: Uint8Array, off1: number, src: Uint8Array, off2: number, length: number): void {
    var totalOffset1 = off1 + dest.byteOffset;
    var totalOffset2 = off2 + src.byteOffset;
    var lower4Bound = Math.min(-totalOffset1 & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (((totalOffset1 - totalOffset2) & 3) !== 0 || lower4Bound >= upper4Bound) {
        for (var i = 0; i < length; ++i) {
            dest[i + off1] ^= src[i + off2];
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            dest[i + off1] ^= src[i + off2];
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var dest_32 = new Uint32Array(dest.buffer, totalOffset1 + lower4Bound, intermediate4Length);
        var src_32 = new Uint32Array(src.buffer, totalOffset2 + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            dest_32[i] ^= src_32[i];
        }
        for (var i = upper4Bound; i < length; ++i) {
            dest[i + off1] ^= src[i + off2];
        }
    }
}

export function empty(src: Uint8Array, offset: number, length: number): boolean;
export function empty(src: Uint8Array): boolean;
export function empty(src: Uint8Array, offset?: number, length?: number): boolean {
    if (!Number.isInteger(offset) || !Number.isInteger(length)) {
        offset = 0;
        length = src.length;
    }
    var totalOffset = offset + src.byteOffset;
    var lower4Bound = Math.min(-totalOffset & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (lower4Bound >= upper4Bound) {
        for (var i = 0; i < length; ++i) {
            if (src[i+offset] != 0)
                return false;
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            if (src[i+offset] != 0)
                return false;
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var src_32 = new Uint32Array(src.buffer, totalOffset + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            if (src_32[i] != 0)
                return false;
        }
        for (var i = upper4Bound; i < length; ++i) {
            if (src[i+offset] != 0)
                return false;
        }
    }
    return true;
}

export function clear(src: Uint8Array, offset: number, length: number): void;
export function clear(src: Uint8Array): void;
export function clear(src: Uint8Array, offset?: number, length?: number): void {
    if (!Number.isInteger(offset) || !Number.isInteger(length)) {
        offset = 0;
        length = src.length;
    }
    var totalOffset = offset + src.byteOffset;
    var lower4Bound = Math.min(-totalOffset & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (lower4Bound >= upper4Bound) {
        for (var i = 0; i < length; ++i) {
            src[i+offset] = 0;
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            src[i+offset] = 0;
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var src_32 = new Uint32Array(src.buffer, totalOffset + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            src_32[i] = 0;
        }
        for (var i = upper4Bound; i < length; ++i) {
            src[i+offset] = 0;
        }
    }
}

export function sequenceEqual(src1: Uint8Array, src2: Uint8Array): boolean;
export function sequenceEqual(src1: Uint8Array, src2: Uint8Array, offset: number): boolean;
export function sequenceEqual(src1: Uint8Array, off1: number, src2: Uint8Array, off2: number, length: number): boolean;
export function sequenceEqual(src1: Uint8Array, b, c?, d?, e?): boolean {
    var off1: number, src2: Uint8Array, off2: number, length: number;
    if (b instanceof Uint8Array) {
        src2 = b;
        off1 = 0;
        if (Number.isInteger(c)) {
            off2 = c;
        } else {
            off2 = 0;
        }
        length = src1.length;
    } else {
        off1 = b;
        src2 = c;
        off2 = d;
        length = e;
    }
    var totalOffset1 = off1 + src1.byteOffset;
    var totalOffset2 = off2 + src2.byteOffset;
    var lower4Bound = Math.min(-totalOffset1 & 3, length);
    var upper4Bound = Math.min(length & ~3 + lower4Bound, length);
    if (((totalOffset1 - totalOffset2) & 3) !== 0 || lower4Bound >= upper4Bound) {
        for (var i = 0; i < length; ++i) {
            if (src1[i+off1] != src2[i+off2])
                return false;
        }
    } else {
        for (var i = 0; i < lower4Bound; ++i) {
            if (src1[i+off1] != src2[i+off2])
                return false;
        }
        var intermediate4Length = (upper4Bound - lower4Bound) >> 2;
        var src1_32 = new Uint32Array(src1.buffer, totalOffset1 + lower4Bound, intermediate4Length);
        var src2_32 = new Uint32Array(src2.buffer, totalOffset2 + lower4Bound, intermediate4Length);
        for (var i = 0; i < intermediate4Length; ++i) {
            if (src1_32[i] != src2_32[i])
                return false;
        }
        for (var i = upper4Bound; i < length; ++i) {
            if (src1[i+off1] != src2[i+off2])
                return false;
        }
    }
    return true;
}

export function promisify<T>(fn: (cb: (err: Error, res?: T) => void) => void): () => Promise<T>;
export function promisify<T, A1>(fn: (arg1: A1, cb: (err: Error, res?: T) => void) => void): (arg1: A1) => Promise<T>;
export function promisify<T, A1, A2>(fn: (arg1: A1, arg2: A2, cb: (err: Error, res?: T) => void) => void): (arg1: A1, arg2: A2) => Promise<T>;
export function promisify<T, A1, A2, A3>(fn: (arg1: A1, arg2: A2, arg3: A3, cb: (err: Error, res?: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3) => Promise<T>;
export function promisify<T, A1, A2, A3, A4>(fn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, cb: (err: Error, res?: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => Promise<T>;
export function promisify<T, A1, A2, A3, A4, A5>(fn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, cb: (err: Error, res?: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5) => Promise<T>;
export function promisify<T, A1, A2, A3, A4, A5, A6>(fn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, cb: (err: Error, res?: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6) => Promise<T>;
export function promisify<T, A1, A2, A3, A4, A5, A6, A7>(fn: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7, cb: (err: Error, res?: T) => void) => void): (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, arg6: A6, arg7: A7) => Promise<T>;
export function promisify(fn: Function) {
    return function(...args: any[]) {
        return new Promise(function(resolve, reject) {
            fn(...args, function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    };
}

export function pad4(n: number) {
    return n < 10000 ? ("0000" + n).slice(-4) : `${n}`;
}

export function pad5(n: number) {
    return n < 100000 ? ("00000" + n).slice(-5) : `${n}`;
}

export function base64Encode(arr: Uint8Array) {
    if (typeof Buffer !== "undefined") {
        return createBuffer(arr).toString("base64");
    }
    return btoa(String.fromCharCode(...arr));
}

export function getStampSav(arr: Uint8Array, off: number): string {
    return base64Encode(arr.subarray(off, off+8));
}

export function getStampBv(arr: Uint8Array, off: number): string {
    return base64Encode(arr.subarray(off, off+0x10));
}
