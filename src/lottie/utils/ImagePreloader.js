class ImagePreloader {
  constructor() {
    this.assetsPath = '';
    this.path = '';
    this.totalAssets = 0;
    this.totalImages = 0;
    this.loadedAssets = 0;
    this.imagesLoadedCb = null;
    this.images = [];
  }

  imageLoaded() {
    this.loadedAssets += 1;
    if (this.loadedAssets === this.totalImages) {
      if (this.imagesLoadedCb) {
        this.imagesLoadedCb(null);
      }
    }
  }

  getAssetsPath(assetData) {
    let path = '';
    if (assetData.e) {
      path = assetData.p;
    } else if (this.assetsPath) {
      let imagePath = assetData.p;
      if (imagePath.indexOf('images/') !== -1) {
        imagePath = imagePath.split('/')[1];
      }
      path = this.assetsPath + imagePath;
    } else {
      path = this.path;
      path += assetData.u ? assetData.u : '';
      path += assetData.p;
    }
    return path;
  }

  getImage(assetData) {
    let i = 0;
    const len = this.images.length;
    while (i < len) {
      if (this.images[i].assetData === assetData) {
        return this.images[i].img;
      }
      i += 1;
    }
  }

  createImageData(assetData) {
    const path = this.getAssetsPath(assetData, this.assetsPath, this.path);
    const img = {
      src: path
    };
    this.loadImage(path, (tmpPath) => {
      if (tmpPath) {
        wx.getImageInfo({
          src: tmpPath,
          success(res) {
            const { width, height } = res;
            img.src = res.path;
            img.width = width;
            img.height = height;
          }
        });
      }
    });
    const ob = {
      img,
      assetData
    };
    return ob;
  }

  loadImage(path, cb) {
    const imageLoaded = this.imageLoaded.bind(this);
    if (path.startsWith('data:')) {
      loadBase64Image(path)
        .then(filePath => {
          cb(filePath);
          imageLoaded();
        });
    } else {
      wx.downloadFile({
        url: path,
        success: (res) => {
          // 本地路径
          cb(res.tempFilePath);
          imageLoaded();
        },
        fail: () => {
          imageLoaded();
        }
      });
    }
  }

  loadAssets(assets, cb) {
    this.imagesLoadedCb = cb;
    this.totalAssets = assets.length;
    let i;
    for (i = 0; i < this.totalAssets; i += 1) {
      if (!assets[i].layers) {
        this.images.push(this.createImageData(assets[i]));
        this.totalImages += 1;
      }
    }
  }

  setPath(path) {
    this.path = path || '';
  }

  setAssetsPath(path) {
    this.assetsPath = path || '';
  }

  destroy() {
    this.imagesLoadedCb = null;
  }
}

const fsm = wx.getFileSystemManager();

function loadBase64Image(base64data) {
  return new Promise((resolve, reject) => {
    const [, format, bodyData] = /data:image\/(\w+);base64,(.*)/.exec(base64data) || [];
    if (!format) {
      reject(new Error('ERROR_BASE64SRC_PARSE'));
    }
    const filename = `${Math.random()}`.substr(2);
    const filePath = `${wx.env.USER_DATA_PATH}/${filename}.${format}`;
    const buffer = wx.base64ToArrayBuffer(bodyData);
    fsm.writeFile({
      filePath,
      data: buffer,
      encoding: 'binary',
      success() {
        resolve(filePath);
      },
      fail() {
        reject(new Error('ERROR_BASE64SRC_WRITE'));
      }
    });
  });
}

export default ImagePreloader;
