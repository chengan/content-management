/**
 * 李诞风格提示词服务
 * 基于 .docs/prompts/lidan.md 的风格指导创建改写提示词
 */

export interface LiDanPromptConfig {
  intensity: 'light' | 'medium' | 'strong'; // 风格强度
  focusAreas: Array<'humor' | 'philosophy' | 'irony' | 'observation' | 'self-reflection'>;
  customTone?: string;
}

export class LiDanPromptService {
  
  /**
   * 生成基础的李诞风格改写提示词
   */
  static generateBasePrompt(): string {
    return `你扮演的角色是李诞风格文案助手，有如下擅长的技能：

1. 反讽与幽默：善于使用反讽来表达更深层次的社会和人性观察
2. 生活哲学的探讨：常常探讨生活的哲学意义，如人生的无常、孤独和自我认知
3. 现实主义：表达往往根植于现实生活的观察，不回避生活的矛盾和困境
4. 普遍性与个人性的结合：将个人经历普遍化，让广泛的读者能够产生共鸣
5. 语言的精准与画面感：用富有画面感的描述来增强语言的效果
6. 深刻的自我反思与批评：用自我反思的方式，批评自己和社会的某些做法
7. 寓教于乐的能力：在轻松幽默的表达中包含深刻的生活智慧和人生观察

请用李诞的风格来改写以下文字，要求：
- 保持原文的核心意思不变
- 融入李诞式的幽默表达和人生感悟
- 使用生活化的语言，避免过于正式的表达
- 适当加入反讽和自我调侃的元素
- 保持文字的画面感和可读性`;
  }
  
  /**
   * 根据配置生成定制化的李诞风格提示词
   */
  static generateCustomPrompt(config: LiDanPromptConfig): string {
    const basePrompt = this.generateBasePrompt();
    
    let customInstructions = '\n\n特别要求：\n';
    
    // 风格强度
    switch (config.intensity) {
      case 'light':
        customInstructions += '- 轻度李诞风格：保持适度的幽默，不要过于夸张\n';
        break;
      case 'medium':
        customInstructions += '- 中度李诞风格：融入明显的幽默和人生观察\n';
        break;
      case 'strong':
        customInstructions += '- 强烈李诞风格：大量运用讽刺、自嘲和哲学思辨\n';
        break;
    }
    
    // 重点关注领域
    if (config.focusAreas.includes('humor')) {
      customInstructions += '- 重点加强：幽默表达，用轻松的方式表达观点\n';
    }
    if (config.focusAreas.includes('philosophy')) {
      customInstructions += '- 重点加强：人生哲学，探讨生活的深层意义\n';
    }
    if (config.focusAreas.includes('irony')) {
      customInstructions += '- 重点加强：反讽元素，用对比来突出现实的荒诞\n';
    }
    if (config.focusAreas.includes('observation')) {
      customInstructions += '- 重点加强：生活观察，从日常细节中发现深刻洞察\n';
    }
    if (config.focusAreas.includes('self-reflection')) {
      customInstructions += '- 重点加强：自我反思，用自嘲的方式进行批评\n';
    }
    
    // 自定义语调
    if (config.customTone) {
      customInstructions += `- 语调要求：${config.customTone}\n`;
    }
    
    return basePrompt + customInstructions;
  }
  
  /**
   * 生成分段改写的具体提示词
   */
  static generateSegmentPrompt(segmentContent: string, config?: LiDanPromptConfig): string {
    const basePrompt = config ? this.generateCustomPrompt(config) : this.generateBasePrompt();
    
    return `${basePrompt}

需要改写的文字：
"""
${segmentContent}
"""

请直接返回改写后的内容，不需要解释过程。`;
  }
  
  /**
   * 生成段落衔接优化的提示词
   */
  static generateTransitionPrompt(segments: string[]): string {
    return `你是李诞风格的文案助手。现在有几个已经改写好的段落，需要优化它们之间的衔接，使整篇文章更加流畅自然。

要求：
1. 保持每个段落的李诞风格不变
2. 添加合适的过渡词或连接句，使段落间衔接自然
3. 确保整体逻辑清晰，符合李诞的表达习惯
4. 可以适当调整段落顺序，但要保持核心意思

段落内容：
${segments.map((segment, index) => `段落${index + 1}：\n${segment}`).join('\n\n')}

请返回优化后的完整文章。`;
  }
  
  /**
   * 生成批量改写的提示词模板
   */
  static generateBatchPrompt(segments: string[], config?: LiDanPromptConfig): string[] {
    return segments.map(segment => this.generateSegmentPrompt(segment, config));
  }
  
  /**
   * 生成风格检查的提示词
   */
  static generateStyleCheckPrompt(originalText: string, rewrittenText: string): string {
    return `你是李诞风格的专业评估师。请评估以下改写文本是否符合李诞的风格特点。

李诞风格的关键特征：
1. 幽默与反讽并重
2. 深刻的人生观察
3. 现实主义态度
4. 自我反思与批评
5. 生活化的语言表达
6. 哲学思辨与日常感悟结合

原文：
"""
${originalText}
"""

改写文：
"""
${rewrittenText}
"""

请从以下几个维度评分（1-10分）：
1. 幽默程度
2. 哲学深度
3. 语言生动性
4. 风格一致性
5. 可读性

并提供具体的改进建议。`;
  }
  
  /**
   * 李诞经典表达模式
   */
  static getClassicPatterns(): string[] {
    return [
      '说起来，{content}。不过这事儿吧，也就那么回事。',
      '{content}，人生就是这样，总有些事情让人哭笑不得。',
      '朋友们，{content}。这大概就是生活的真相了。',
      '{content}。毕竟在这个世界上，什么事都有可能发生。',
      '其实{content}这件事，挺有意思的，至少比看电视剧有趣。',
      '人生的真相是这样的：{content}，但是我们总要假装很在乎。',
      '大部分人都有一个经不起推敲的幻觉，认为{content}。',
      '{content}。开心点朋友们，人间不值得。',
      '我觉得{content}，不过我也可能是错的，毕竟我就是个普通人。',
      '{content}。这就是成年人的世界，复杂得让人想哭。'
    ];
  }
  
  /**
   * 李诞常用词汇和短语
   */
  static getCommonPhrases(): Record<string, string[]> {
    return {
      开场: ['说起来', '其实', '朋友们', '人生就是这样', '大部分人都有一个幻觉'],
      转折: ['不过', '说起来', '毕竟', '然而', '可是'],
      结尾: ['人间不值得', '也就那么回事', '这大概就是真相了', '至少比看电视剧有趣', '什么事都有可能发生'],
      哲学: ['人生的真相', '生活的意义', '存在的价值', '内心世界', '现实与幻想'],
      自嘲: ['我这个普通人', '我也可能是错的', '像我这样的人', '反正我是不懂', '我就是个俗人'],
      观察: ['成年人的世界', '这个时代', '现在的生活', '人与人之间', '社会现象']
    };
  }
  
  /**
   * 为特定主题生成李诞风格表达
   */
  static generateThemeExpression(theme: string, content: string): string {
    const phrases = this.getCommonPhrases();
    const patterns = this.getClassicPatterns();
    
    // 根据主题选择合适的表达模式
    let expression = '';
    
    switch (theme.toLowerCase()) {
      case 'work':
      case '工作':
        expression = `说起来，${content}。不过工作这事儿吧，就像谈恋爱，开始都挺美好，时间长了就发现全是套路。毕竟我们都是成年人，总要假装很热爱工作。`;
        break;
      case 'life':
      case '生活':
        expression = `${content}，这大概就是生活的真相了。人生就是这样，总有些事情让人哭笑不得。开心点朋友们，人间不值得。`;
        break;
      case 'relationship':
      case '关系':
        expression = `人生的真相是这样的：${content}。不过人与人之间的关系就像WiFi密码，看起来很复杂，其实就那几个套路。`;
        break;
      default:
        const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
        expression = randomPattern.replace('{content}', content);
    }
    
    return expression;
  }
}

export default LiDanPromptService;