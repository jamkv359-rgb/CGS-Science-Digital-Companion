# Science Digital Companion

A static website built from the Year 9 and Year 10 Science booklets and lesson slides:

- **Year 9:** 09SBC Biological & Chemical Science, 09SPH Physical Science
- **Year 10:** 10SBP Biological & Physical Science, 10SCB Chemical & Biological Science

## Opening the site

Open `index.html` in any browser. No internet connection or server is needed. To publish it, copy the whole `Website` folder (minus `_source` if you like) to any web host, SharePoint/Teams site or LMS that serves HTML files.

- **Home page** (`index.html`): topic cards grouped by year and course, plus the **Themes** panel. Students can pick a preset or set their own background colour, section colour, text colour, accent colour, corner radius and borders. The choice is saved in the browser and applies to every page.
- **Chapter pages** (`chem-2.html`, `wslh-5.html` …): one page per booklet chapter. Each section is a collapsible heading. The sidebar holds the chapter navigation, and Previous/Next links run through the whole course.
- **Practice questions** sit where they appear in the booklet or slides. Multiple-choice, true/false, matching, fill-the-blank and calculation questions are marked when the student clicks **Check answer**. Short-answer questions let the student type a response and then **Compare with model answer**. Answers are saved in the browser on that device.
- **Tests & exams** (`test-*.html`): past topic tests, exams and revision papers for each course, listed on the home page under each course and on the matching topic cards. Students can check answers as they go or sit the paper in exam conditions with a timer, then mark it: limited-answer questions are marked automatically, and written answers are compared with the model answer and self-marked. Their score is saved and shown on the home page.

## Editing content

All content lives in `_source/content/*.txt`, one file per topic, and `_source/tests/*.txt`, one file per test or exam paper. After editing, rebuild the pages:

```
python _source/build.py
```

The build prints each topic's chapter and question count, plus warnings (for example, a missing image or a question without an answer). Images live in `img/<topic>/` and `img/tests/<test id>/`.

See `_source/FORMAT.md` for the content format, including how to write each question type.
