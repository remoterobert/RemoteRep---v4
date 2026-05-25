import _ from 'lodash';

const dataVersion: number = 4;

const get = (path?: string) => {
    let cache = {};
    const stringData = localStorage.getItem(`localDataV${dataVersion}`);
    if (stringData) cache = JSON.parse(stringData);
    if (path) return _.get(cache, path);
    return cache;
};

const set = (path: string, value: any) => {
    const localData = get();
    _.set(localData, path, value);
    localStorage.setItem(`localDataV${dataVersion}`, JSON.stringify(localData));
};

export { get, set };
