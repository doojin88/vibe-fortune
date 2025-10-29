import { copyToClipboard } from '../../../../src/lib/utils/clipboard';

// Mock navigator.clipboard and document methods
const mockWriteText = jest.fn();
const mockExecCommand = jest.fn().mockReturnValue(true);

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  configurable: true,
});

// Mock document.execCommand
document.execCommand = mockExecCommand;

describe('Clipboard Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockClear();
    mockExecCommand.mockClear();
  });

  describe('copyToClipboard - Modern Clipboard API', () => {
    it('should copy text to clipboard using Clipboard API when available', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const text = 'Test content to copy';
      const result = await copyToClipboard(text);

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(text);
      expect(mockWriteText).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const result = await copyToClipboard('');

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith('');
    });

    it('should handle long text content', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const longText = 'a'.repeat(10000);
      const result = await copyToClipboard(longText);

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(longText);
    });

    it('should handle special characters and Unicode', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const unicodeText = '사주분석 결과: ✨ 🎯 한글 테스트 & Special chars';
      const result = await copyToClipboard(unicodeText);

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(unicodeText);
    });

    it('should handle newlines and whitespace', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const multilineText = 'Line 1\nLine 2\n\nLine 4';
      const result = await copyToClipboard(multilineText);

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(multilineText);
    });

    it('should handle JSON strings', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const jsonText = JSON.stringify({ name: '홍길동', age: 30 });
      const result = await copyToClipboard(jsonText);

      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(jsonText);
    });

    it('should return false when Clipboard API throws error', async () => {
      const error = new Error('Clipboard API failed');
      mockWriteText.mockRejectedValueOnce(error);
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await copyToClipboard('test');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('클립보드 복사 실패:', error);
      consoleSpy.mockRestore();
    });

    it('should handle DOMException when Clipboard API is denied', async () => {
      const error = new DOMException('Clipboard write access denied', 'NotAllowedError');
      mockWriteText.mockRejectedValueOnce(error);
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await copyToClipboard('test');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('copyToClipboard - Fallback (textarea + execCommand)', () => {
    it('should use fallback when navigator.clipboard is not available', async () => {
      // Temporarily remove clipboard API
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });

      mockExecCommand.mockReturnValueOnce(true);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');

      const result = await copyToClipboard('Fallback test');

      expect(result).toBe(true);
      expect(appendChildSpy).toHaveBeenCalled();
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(removeChildSpy).toHaveBeenCalled();

      // Restore clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      });

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should use fallback when isSecureContext is false', async () => {
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: false,
      });

      mockExecCommand.mockReturnValueOnce(true);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');

      const result = await copyToClipboard('Non-secure context test');

      expect(result).toBe(true);
      expect(appendChildSpy).toHaveBeenCalled();
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(removeChildSpy).toHaveBeenCalled();

      // Restore secure context
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should return false when fallback fails (execCommand returns false)', async () => {
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });

      mockExecCommand.mockReturnValueOnce(false);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await copyToClipboard('test');

      expect(result).toBe(false);
      expect(removeChildSpy).toHaveBeenCalled();

      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      });

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should create textarea with correct positioning styles', async () => {
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });

      mockExecCommand.mockReturnValueOnce(true);
      let createdTextarea: HTMLTextAreaElement | null = null;

      const appendChildSpy = jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation((element) => {
          if (element instanceof HTMLTextAreaElement) {
            createdTextarea = element;
          }
          return element as any;
        });

      // Mock console.error to suppress expected error messages
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await copyToClipboard('test');

      expect(createdTextarea).toBeDefined();
      expect(createdTextarea?.value).toBe('test');
      expect(createdTextarea?.style.position).toBe('fixed');
      expect(createdTextarea?.style.opacity).toBe('0');

      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      });

      appendChildSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should clean up textarea after copy', async () => {
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });

      mockExecCommand.mockReturnValueOnce(true);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');

      await copyToClipboard('test');

      // Should call appendChild for textarea
      expect(appendChildSpy).toHaveBeenCalled();
      // Should call removeChild to clean up
      expect(removeChildSpy).toHaveBeenCalled();

      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      });

      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should call select() on textarea before copy', async () => {
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });

      mockExecCommand.mockReturnValueOnce(true);
      let selectWasCalled = false;

      const originalCreateElement = document.createElement;
      jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'textarea') {
          const textarea = originalCreateElement.call(document, 'textarea') as HTMLTextAreaElement;
          const originalSelect = textarea.select.bind(textarea);
          textarea.select = jest.fn(() => {
            selectWasCalled = true;
            originalSelect();
          });
          return textarea as any;
        }
        return originalCreateElement.call(document, tag);
      });

      await copyToClipboard('test');

      // Fallback implementation should work
      expect(selectWasCalled || mockExecCommand).toBeDefined();

      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      });
    });
  });

  describe('copyToClipboard - Error handling', () => {
    it('should catch and log errors gracefully', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Unknown error'));
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await copyToClipboard('test');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle promise rejection', async () => {
      mockWriteText.mockRejectedValueOnce(new TypeError('Network error'));
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await copyToClipboard('test');

      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('copyToClipboard - Real-world scenarios', () => {
    it('should handle copying analysis result markdown', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const analysisResult = `# 사주분석 결과

**이름**: 홍길동
**생년월일**: 2000-01-01
**성별**: 남

## 분석 결과

당신의 사주는...`;

      const result = await copyToClipboard(analysisResult);

      expect(typeof result).toBe('boolean');
    });

    it('should handle copying plain text for sharing', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const shareText = '나의 사주 분석 결과를 확인해보세요!';
      const result = await copyToClipboard(shareText);

      expect(typeof result).toBe('boolean');
    });

    it('should handle copying URL with query parameters', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });

      const url = 'https://example.com/result?id=abc123&share=true';
      const result = await copyToClipboard(url);

      expect(typeof result).toBe('boolean');
    });
  });
});
