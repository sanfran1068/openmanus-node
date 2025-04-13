import axios from 'axios';
import { BaseTool } from './base';

export class BaiduSearchTool extends BaseTool {
    private readonly baseUrl = 'https://www.baidu.com/s';
    private readonly headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    };

    constructor() {
        super(
            'baidu_search',
            '使用百度搜索引擎进行网页搜索',
            {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: '搜索关键词',
                    },
                    num_results: {
                        type: 'number',
                        description: '返回结果数量，默认为5',
                        default: 5,
                    },
                },
                required: ['query'],
            }
        );
    }

    async execute(args: { query: string; num_results?: number }): Promise<string> {
        try {
            const { query, num_results = 5 } = args;
            const response = await axios.get(this.baseUrl, {
                params: {
                    wd: query,
                    rn: num_results,
                },
                headers: this.headers,
            });

            const results = this.parseSearchResults(response.data, num_results);
            return this.formatResults(results);
        } catch (error) {
            console.error('Baidu search error:', error);
            throw new Error('百度搜索失败');
        }
    }

    private parseSearchResults(html: string, numResults: number): Array<{ title: string; url: string; description: string }> {
        const results: Array<{ title: string; url: string; description: string }> = [];
        
        // 使用正则表达式提取搜索结果
        const titleRegex = /<h3[^>]*>.*?<a[^>]*>(.*?)<\/a>.*?<\/h3>/g;
        const urlRegex = /<h3[^>]*>.*?<a[^>]*href="(.*?)"[^>]*>.*?<\/a>.*?<\/h3>/g;
        const descRegex = /<div[^>]*class="c-abstract"[^>]*>(.*?)<\/div>/g;

        const titles = this.extractMatches(html, titleRegex);
        const urls = this.extractMatches(html, urlRegex);
        const descriptions = this.extractMatches(html, descRegex);

        // 确保所有数组长度一致
        const maxLength = Math.min(titles.length, urls.length, descriptions.length, numResults);

        for (let i = 0; i < maxLength; i++) {
            results.push({
                title: this.cleanText(titles[i]),
                url: this.cleanUrl(urls[i]),
                description: this.cleanText(descriptions[i] || ''),
            });
        }

        return results;
    }

    private extractMatches(html: string, regex: RegExp): string[] {
        const matches: string[] = [];
        let match;
        while ((match = regex.exec(html)) !== null) {
            matches.push(match[1]);
        }
        return matches;
    }

    private cleanText(text: string | null): string {
        if (!text) return '';
        return text
            .replace(/<[^>]*>/g, '') // 移除HTML标签
            .replace(/&nbsp;/g, ' ')  // 替换空格
            .replace(/&amp;/g, '&')   // 替换&符号
            .replace(/&lt;/g, '<')    // 替换<符号
            .replace(/&gt;/g, '>')    // 替换>符号
            .trim();
    }

    private cleanUrl(url: string): string {
        if (!url) return '';
        // 处理百度跳转链接
        if (url.startsWith('/s?')) {
            return `https://www.baidu.com${url}`;
        }
        return url;
    }

    private formatResults(results: Array<{ title: string; url: string; description: string }>): string {
        if (results.length === 0) {
            return '没有找到相关搜索结果。';
        }

        let formattedResults = '搜索结果：\n\n';
        results.forEach((result, index) => {
            formattedResults += `${index + 1}. ${result.title}\n`;
            formattedResults += `   链接: ${result.url}\n`;
            formattedResults += `   描述: ${result.description}\n\n`;
        });

        return formattedResults;
    }
}
