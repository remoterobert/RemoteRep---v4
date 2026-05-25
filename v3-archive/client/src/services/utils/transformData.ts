const excludedKeys = [
    'yearsOfExperience',
    'salesRole',
    'minimumCompensation',
    'compensationType',
    'commitment',
];

export const transformData = <T extends Record<string, string>>(
    keys: (keyof T)[],
    data: T
): Partial<T> => {
    const obj: Partial<T> = {};

    keys.forEach((key) => {
        if (excludedKeys.includes(key as string)) {
            obj[key] = data[key];
        } else {
            obj[key] = data[key].split(', ') as any;
        }
    });

    return obj;
};
