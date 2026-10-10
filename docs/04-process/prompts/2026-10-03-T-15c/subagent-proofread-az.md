# Subagent 5 — proofreading of the Azerbaijani translation of the retrospective

Agent type `Explore` (read-only, no write tools), model Opus 5.5, dispatched 2026-10-03 after the owner's request
to translate the retrospective (PR #82) into Azerbaijani and keep it outside the repository. Copied from the
brief the agent sent and the hand-off message that came back. The absolute home path in both is replaced by the
placeholder `/Users/<name>` (the home-path guard, T-15a); nothing else is changed. The translation itself is
not in the repository.

## Brief

Read-only proofreading task. Do NOT edit any file.

SOURCE (English): `/Users/<name>/Own/ai-native-personal-finance/.claude/worktrees/task-T-15c/docs/04-process/release-1-retrospective.md`
TRANSLATION (Azerbaijani): `/Users/<name>/Own/ai-native-personal-finance-az/release-1-retrospective.az.md`

The translation must be faithful, natural Azerbaijani (Latin script), with full correct diacritics (ə, ı, ö, ü, ç, ş, ğ, İ), and must keep technical terms/identifiers/commands/paths/numbers/line references unchanged. Quotes from a process log are translated; the owner's own Azerbaijani quotes ("release artıq baş verib və Verceldə artıq işləyir", "4 bunu anlamadım. izah et, 5 bunu izah et", "bütün tech-deptlər (sic) sonra fix olur...", "draftdan çıxmış branchlər merge hazır sayılır və mən merge edirəm") must stay exactly as in the source. The translator's note block at the top of the translation is intentionally extra.

Read both files fully and compare section by section. Report ONLY problems, as a list: `line in translation | category | the problem | suggested replacement`. Categories: MEANING (a sentence says something different, adds or drops a claim, a negation or number or hedge changed), TERM (a wrong or odd Azerbaijani word for the concept, e.g. a literal calque), DIACRITIC (a missing or wrong diacritic or typo), STYLE (clumsy or unnatural but not wrong). Prioritise MEANING and TERM; list STYLE only if clearly awkward, max 10. Check especially: section 4 (themes A–H and the closing paragraph), section 5 text, the proposals table P1–P8, section 7. Do not report things that are correct. Output max ~700 words. If you find no MEANING problems say so explicitly.

## Report

I compared both files line by line, all sections plus Appendix A. The code block and every owner quote match the source exactly. Identifiers, commands, paths, numbers and line references are unchanged. Number suffixes like T-14-ün, Q7-nin and 6-cı are correct. I found 4 real MEANING problems and 1 borderline one; none of them changes a number, a negation or a hedge.

**MEANING**

- 150 | MEANING | "a statement was accepted _before_ something could contradict it" became "without" ("olmadan"), so the time sense is lost. This is the key line of section 4's closing paragraph. | "_bir ifadə, onu təkzib edə biləcək nəsə ortaya çıxmazdan əvvəl qəbul edildi._"
- 232 (P5) | MEANING | "says what is decided" means what is being decided. "nəyin qərara bağlandığını" means what has already been decided. | "nə barədə qərar verilməli olduğunu, niyə, variantları və tövsiyəni deyir"
- 170 | MEANING | "per the same entry" is the source of the information. "eyni qeydə görə … seçdi" can read as the owner choosing Frankfurt _because of_ the entry. | "(həmin qeydə əsasən, sahib Frankfurt-u seçib)"
- 209 | MEANING | "which open decision each answers" is garbled: the subject should be each later entry, not each decision. | "onların hər birinin hansı açıq qərara cavab verdiyi yoxlanmayıb"
- 155–156 | MEANING (minor) | "would have stopped" is counterfactual, but "qarşısını alıb-almayacağını" reads as future. | "təkrarların qarşısını alıb-ala bilərdimi, loq bunu demir"

**TERM**

- 23 | TERM | "listed lessons": "sıralayıb" means ranked or ordered. | "sadalayıb"
- 58, 117, 208 | TERM | "pass" is translated as "keçid" (transition or crossing) every time. | 58: "keçidlərinin" → "yoxlamalarının"; 117: "planın gözlənilən keçid cəmi" → "planın gözlədiyi keçən testlərin sayı"; 208: "düzəliş keçidi" → "düzəliş mərhələsi"
- 74 | TERM | "drift" became "sürüşmə", a literal calque. | "tapdığı uyğunsuzluğu aradan qaldırdı"
- 75, 228 | TERM | "read Done" became "Done oxunur", a literal calque. | "Done göstərir" / "Done yazılıb"
- 88, 234 | TERM | "cited" / "names it" became "çəkdi" / "çəkir" without "adını", which is unclear. | "NFR-D4-ə istinad edirdi"; "bunun adını çəkir"
- 114 | TERM | "İddia verilməzdən" is not idiomatic. | "İddia irəli sürülməzdən əvvəl"
- 115 | TERM | "a run" became "bir işə düşmə" (launch). | "baş verməmiş bir işlətməni (run) iddia etdi"
- 119, 120 | TERM | "act on" became "üzərində hərəkət etmək", a calque. | "Sahibin əsasında qərar verə bilmədiyi…"; "sahib onlara əsasən addım ata bilmədi"
- 137 | TERM | "authenticated page … broken" became "autentifikasiyalı səhifə sınıq". | "autentifikasiya tələb edən hər səhifə işləmirdi"
- 203 | TERM | "race" became "yarışı". | "stat-sonra-oxu yarış vəziyyəti (race condition)"
- 165 | TERM | "pushed for" became "təzyiq etdi" (pressured). | "tək prioritetdə israr etdi"
- 213, 215, 272 | TERM | "tick" is left in English ("tick et"). | "işarələ" / "işarələyir"
- 215 | TERM | "the wording" became "formulanı". | "mətni" / "ifadəni"
- 224 | TERM | "does not mention" became "xatırlatmır" (does not remind). | "bəhs etmir"
- 249 | TERM | "with head develop" became "`develop` başlı". | "head-i `develop` olan"
- 285 | TERM | "running text" became "işlək mətndə". | "adi mətndə"

**DIACRITIC / spelling**

- 5, 37, 43, 180 | DIACRITIC | "Prosess" / "prosess" is misspelled. | "Proses" / "proses"
- 58 | DIACRITIC | "reviewu" has no hyphen and the wrong suffix; the rest of the file uses forms like "review-su". | "review-su"

**STYLE**

- 98 | STYLE | "gətirilən qeydlərdən dayananların sayıdır; sitatlar onların ən güclü seçdiyi üçüdür" is clumsy. | "gətirilən qeydlərdən təsdiqini saxlayanların sayıdır; sitatlar onların ən güclü kimi seçdiyi üç sitatdır"
- 105 | STYLE | "naxış" (pattern, used here for a behaviour) is odd, and "still" is dropped. | "amma bu hal T-02-dən T-15a-ya qədər hələ də təkrarlanır"
- 116 | STYLE | "Say-hesablar" is odd. | "Saylar"
- 126 | STYLE | "qeyd" is used for both "records" and "entries", which is confusing. | "iki sənəd artıq bağlanmış qeydlərdə hələ … deyirdi"
- 147 | STYLE | "suala qədər verilmiş məsləhət" | "sual verilməzdən əvvəl verilmiş məsləhət"
- 150 | STYLE | "Səkkizinin cəmi" is a calque of "What the eight add up to". | "Səkkiz mövzunun yekunu"
- 47 | STYLE | "yaşıl işlətdi" | "CI … Chromium, Firefox və WebKit-i işlətdi, hamısı yaşıl"
- 217 | STYLE | "əks olunur … bu əksi oxuyur" (mirror) is awkward. | "PR şablonunda surəti var və bir unit test bu surəti oxuyur"
- 230 | STYLE | "CI yoxlama oldu" | "yoxlamanı CI etdi"

Section 5's text, section 7 and section 8 are otherwise faithful, apart from the items above.
