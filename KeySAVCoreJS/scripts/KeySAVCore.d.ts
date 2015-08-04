/// <reference path="./KeySAVCoreJS.d.ts"/>

interface LocalizationLanguage {
    abilities: string[];
    countries: string[];
    forms: string[];
    games: string[];
    items: string[];
    languageTags: string[];
    moves: string[];
    natures: string[];
    regions: string[];
    species: string[];
    types: string[];
}

interface Localization {
    de: LocalizationLanguage;
    en: LocalizationLanguage;
    es: LocalizationLanguage;
    fr: LocalizationLanguage;
    it: LocalizationLanguage;
    ja: LocalizationLanguage;
    ko: LocalizationLanguage;
}

declare module "keysavcore" {
    export var Core: typeof KeySAVCore;
    export module Extensions {
        class KeyStore {
            constructor(path: string);
            getSaveKey(stamp1: number, stamp2: number, callback: (e: Error, key: KeySAVCore.Structures.SaveKey) => void);
            getBvKey(stamp1: number, stamp2: number, callback: (e: Error, key: Uint8Array) => void);
            setKey(name: string, data: Uint8Array, key?: KeySAVCore.Structures.SaveKey);
            close();
        }

        export var Localization: Localization;
    }
}

declare module "keysavcore/Localization" {
    var _: Localization;
    export = _;
}
