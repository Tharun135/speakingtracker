const fs = require('fs');

const data = `1. What types of documentation have you created for software products?

Technical documentation for software products usually includes several categories. Installation guides explain how to deploy the software and configure the environment. Administrator guides describe system configuration, user management, and maintenance tasks. User guides focus on how end users interact with the application. Configuration guides explain advanced settings and system parameters. Command reference guides provide detailed descriptions of CLI commands and their usage. Release notes communicate new features, improvements, and bug fixes in each version. Each document serves a specific audience and purpose, and together they provide complete product documentation.

2. How do you simplify complex technical concepts for users?

Simplifying technical concepts begins with understanding the system thoroughly. I review design documents, architecture diagrams, and engineering explanations before writing. Then I translate technical details into user-focused explanations. Complex processes are broken into smaller steps that are easier to follow. Visual aids such as diagrams and screenshots help illustrate workflows. Consistent terminology and simple language improve readability. The goal is to ensure users can understand the system without needing deep engineering knowledge.

3. What is DDLC in technical writing?

DDLC stands for Documentation Development Life Cycle. It defines the structured process used to create and maintain documentation. The first stage is planning, where documentation requirements and deliverables are identified. Next is information gathering from SMEs, product specifications, and system testing. Then comes content creation and structuring based on documentation standards. The documentation goes through review cycles with technical experts and stakeholders. After approval, the content is published in the required formats. Finally, maintenance ensures documentation stays updated with product changes.

4. Why are style guides important in technical documentation?

Style guides ensure consistency across documentation produced by multiple writers. They define standards for terminology, grammar, formatting, and tone. Consistent writing improves readability and user comprehension. Style guides also reduce ambiguity by standardizing how technical terms are used. They help maintain a professional and uniform documentation structure. When teams follow a style guide, documentation quality improves significantly.

5. What experience do you have with XML-based authoring?

XML-based authoring enables structured documentation and content reuse. In XML authoring, content is organized into structured elements rather than free-form text. This allows documentation to be reused across multiple manuals and formats. XML also supports automated publishing to HTML, PDF, and other formats. I have used XML-based tools such as Oxygen or similar editors to create structured topics. CMS platforms manage these topics and assemble them into documentation sets. This approach improves scalability and maintainability of documentation.

6. How does a CMS help manage documentation?

A Content Management System helps manage documentation efficiently across large projects. It stores documentation components in a centralized repository. Writers can reuse topics instead of rewriting content repeatedly. CMS systems also manage version control and track changes over time. Review workflows ensure documentation is approved before publication. Publishing pipelines can generate multiple outputs such as HTML or PDF automatically. Overall, CMS tools improve collaboration and documentation consistency.

7. What is the role of FrameMaker in technical documentation?

FrameMaker is widely used for creating structured and unstructured technical documentation. It is especially useful for long and complex documents such as installation guides or administrator manuals. FrameMaker supports structured content and XML workflows. It allows writers to manage cross-references, indexes, and large document structures. The tool also integrates with publishing workflows to generate multiple output formats. Because of these features, FrameMaker is commonly used in enterprise documentation environments.

8. What challenges arise when documenting command reference guides?

Command reference documentation requires high accuracy because users rely on it to execute system commands. Each command must include syntax, parameters, descriptions, and examples. The challenge is ensuring that the documentation matches the actual system behavior. Commands may also have optional parameters or multiple usage scenarios. Clear formatting is necessary so users can easily read command syntax. Collaboration with engineers helps validate command descriptions. Regular updates are required when commands change between software releases.

9. How do you write effective release notes?

Release notes should clearly communicate product updates in each version. I begin with a summary of major improvements or new features. Each feature update should describe what changed and how it benefits users. Bug fixes should be explained in simple language rather than technical jargon. Known issues may also be included if relevant. Release notes should be concise but informative. This helps users quickly understand what has changed in the new release.

10. How do you document API functionality?

API documentation explains how developers interact with the system programmatically. Each API endpoint should include its purpose and typical use cases. Documentation must specify request parameters, authentication methods, and response formats. Example requests and responses help developers understand integration quickly. Error codes and troubleshooting guidance should also be included. Clear API documentation improves developer productivity and reduces integration issues.

11. How does Agile methodology affect documentation work?

In Agile environments, documentation must evolve alongside the product. Writers participate in sprint planning to understand upcoming features. Documentation tasks should be included in the sprint backlog. Early drafts can be created during development based on design discussions. As features stabilize, documentation is updated with final workflows and screenshots. Continuous collaboration with developers ensures documentation accuracy. This approach keeps documentation synchronized with product development.

12. What networking knowledge is useful for technical writers?

Technical writers documenting telecom or networking systems should understand basic networking concepts. This includes IP addressing, network protocols, routing, and switching. Understanding network architecture helps writers explain system configurations accurately. Knowledge of command-line networking tools is also useful. Certifications such as CCNA provide foundational networking knowledge. This understanding helps writers communicate technical information effectively.

13. How do you mentor junior technical writers?

Mentoring junior writers involves guiding them in writing standards and documentation processes. I review their content and provide feedback on clarity, structure, and technical accuracy. Training sessions can introduce best practices such as task-based writing and style guide usage. Encouraging interaction with SMEs helps junior writers develop technical knowledge. Regular reviews ensure documentation quality remains consistent. Over time, mentoring builds a stronger documentation team.

14. How do you manage a documentation team?

Managing a documentation team requires clear planning and coordination. I assign documentation tasks based on project requirements and writer expertise. Documentation schedules should align with product release timelines. Regular meetings help track progress and address challenges. Content reviews ensure documentation meets quality standards. Collaboration tools help manage workflows and feedback. Effective leadership ensures the team delivers documentation on time.

15. How would you improve documentation processes through automation?

Automation can significantly improve documentation efficiency. CI/CD pipelines can automatically generate documentation builds when content changes. Automated validation tools can detect broken links or formatting issues. Content reuse frameworks reduce duplication and maintenance effort. Templates and style checkers help maintain consistency. Automation reduces manual effort and improves documentation reliability. Over time, these improvements streamline the documentation process.

16. How do you ensure documentation quality?

Documentation quality depends on accuracy, clarity, and consistency. I ensure accuracy by validating information with SMEs and testing workflows when possible. Clarity is achieved by using simple language and structured formatting. Style guides help maintain consistent terminology and writing style. Review cycles allow stakeholders to verify content before publication. Continuous feedback from users helps improve documentation further.

17. Why is technical aptitude important for a technical writer?

Technical aptitude allows writers to understand complex systems quickly. It helps them interpret engineering documentation and system behavior accurately. Writers with strong technical understanding can ask better questions during SME discussions. This improves the quality of documentation. Technical aptitude also helps writers identify potential usability issues. Overall, it enables writers to create clearer and more accurate documentation.`;

const sections = data.split(/\n\d+\. /).filter(s => s.trim().length > 0);
let formatted = [];
let id = 99;

// The first section might have '1. ' in it initially, let's fix the split
const lines = data.split('\n');
const entries = [];
let currentQ = '';
let currentA = [];

for (const line of lines) {
  if (line.match(/^\d+\. /)) {
    if (currentQ) {
      entries.push({ q: currentQ, a: currentA.join('\n').trim() });
    }
    currentQ = line.replace(/^\d+\. /, '').trim();
    currentA = [];
  } else {
    currentA.push(line);
  }
}
if (currentQ) {
  entries.push({ q: currentQ, a: currentA.join('\n').trim() });
}

let resultStr = '';
for (const entry of entries) {
  resultStr += `,
  {
    id: '${id++}',
    category: 'Tech Writing',
    question: ${JSON.stringify(entry.q)},
    tips: [
      "Review the question carefully and structure your answer.",
      "Highlight your practical experience directly related to this.",
      "Summarize with a clear benefit."
    ],
    sampleAnswer: ${JSON.stringify(entry.a)},
    goodVocab: ["Process", "Structure", "Maintainability", "Accuracy"]
  }`;
}

const file = 'd:/Echo Lab/src/data/interviewData.js';
let content = fs.readFileSync(file, 'utf8');

// replace the last } from the array
content = content.replace(/ \}\n\];/, ' }' + resultStr + '\n];');
fs.writeFileSync(file, content);
console.log('Appended ' + entries.length + ' questions!');
