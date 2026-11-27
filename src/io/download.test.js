import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadJson, resetDownloader, setDownloader } from './download';

afterEach(() => {
    resetDownloader();
    vi.restoreAllMocks();
});

describe('downloadJson', () => {
    it('gives the file name and the indented JSON to the downloader', () => {
        const downloader = vi.fn();
        setDownloader(downloader);
        downloadJson('report.json', { a: 1 });
        expect(downloader).toHaveBeenCalledWith('report.json', '{\n  "a": 1\n}');
    });

    it('saves a file through a temporary link in the browser', () => {
        URL.createObjectURL = vi.fn(() => 'blob:fake');
        URL.revokeObjectURL = vi.fn();
        const clicked = [];
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
            clicked.push({ href: this.href, download: this.download, attached: document.body.contains(this) });
        });
        downloadJson('save.json', { ok: true });
        expect(clicked).toEqual([{ href: 'blob:fake', download: 'save.json', attached: true }]);
        expect(document.querySelector('a[download]')).toBeNull();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
        const blob = URL.createObjectURL.mock.calls[0][0];
        expect(blob.type).toBe('application/json');
        expect(blob.size).toBe(JSON.stringify({ ok: true }, null, 2).length);
        delete URL.createObjectURL;
        delete URL.revokeObjectURL;
    });
});
