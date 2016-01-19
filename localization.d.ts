import KeySAVCore = require("./KeySAVCoreJS");

interface LocalizationLanguage {
    abilities: string[];
    countries: string[];
    forms: string[][];
    games: string[];
    items: string[];
    languageTags: string[];
    moves: string[];
    natures: string[];
    regions: string[];
    species: string[];
    types: string[];

    getLocation(pkm: KeySAVCore.Structures.PKX): string;
    getLocation(gameVersion: number, location: number): string;
    getEggLocation(pkm: KeySAVCore.Structures.PKX): string;
    getRibbons(pkm: KeySAVCore.Structures.PKX): string[];
    getBallName(ball: number): string;
}

export declare var de: LocalizationLanguage;
export declare var en: LocalizationLanguage;
export declare var es: LocalizationLanguage;
export declare var fr: LocalizationLanguage;
export declare var it: LocalizationLanguage;
export declare var ja: LocalizationLanguage;
export declare var ko: LocalizationLanguage;
