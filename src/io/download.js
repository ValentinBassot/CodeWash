const browserDownloader = (filename, text) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

let downloader = browserDownloader;

export const setDownloader = (next) => {
    downloader = next;
};

export const resetDownloader = () => {
    downloader = browserDownloader;
};

export const downloadJson = (filename, data) => {
    downloader(filename, JSON.stringify(data, null, 2));
};
