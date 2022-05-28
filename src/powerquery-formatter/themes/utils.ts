// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function strcmp(a: string, b: string): number {
    if (a < b) {
        return -1;
    }

    if (a > b) {
        return 1;
    }

    return 0;
}

export function strArrCmp(a: string[] | undefined, b: string[] | undefined): number {
    const hasA: boolean = Array.isArray(a);
    const hasB: boolean = Array.isArray(b);

    if (!hasA && !hasB) {
        return 0;
    }

    if (!hasA) {
        return -1;
    }

    if (!hasB) {
        return 1;
    }

    // a and b both mush be array
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const len1: number = a!.length;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const len2: number = b!.length;

    if (len1 === len2) {
        // eslint-disable-next-line no-plusplus
        for (let i: number = 0; i < len1; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const res: number = strcmp(a![i], b![i]);

            if (res !== 0) {
                return res;
            }
        }

        return 0;
    }

    return len1 - len2;
}
