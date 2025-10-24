export interface ImgEncMsgSizeReq {
    bitmap: ImageBitmap;
}

export type ImgEncMsgSizeRes = {
    size?: number;
    error?: string;
};

export interface ImgEncProcReq {
    bitmap: ImageBitmap;
    message: string;
}

export type ImgEncProcRes = {
    imageData?: ImageData;
    error?: string;
};

export interface ImgDecProcReq {
    bitmap: ImageBitmap;
}

export type ImgDecProcRes = {
    message?: string;
    error?: string;
};

export interface TxtEncProcReq {
    carrier: string;
    message: string;
}

export type TxtEncProcRes = {
    encTxt?: string;
    error?: string;
};

export interface TxtDecProcReq {
    encTxt: string;
}

export type TxtDecProcRes = {
    message?: string;
    error?: string;
};
