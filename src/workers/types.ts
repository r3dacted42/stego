export interface ImgEncMsgSizeReq {
    bitmap: ImageBitmap;
}

export type ImgEncMsgSizeRes = {
    size: number;
    error?: undefined;
} | {
    size?: undefined;
    error: string;
};

export interface ImgEncProcReq {
    bitmap: ImageBitmap;
    message: string;
}

export type ImgEncProcRes = {
    imageData: ImageData;
    error?: undefined;
} | {
    imageData?: undefined;
    error: string;
};

export interface ImgDecProcReq {
    bitmap: ImageBitmap;
}

export type ImgDecProcRes = {
    message: string;
    error?: undefined;
} | {
    message?: undefined;
    error: string;
};
