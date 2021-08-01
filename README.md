# VSV

** Versatile Separated Values (VSV) **

**Proposal:** A versatile, efficient, unambiguous, standardized, regular, simple text format for creating tables, lists, configuration files, and hierarchy containers, that's easily read and created by both humans and machines, that supports many variations for any personal style, preferences, and protocols. Can accept any nonspace character (including comma, colon, tab, asterisk, etc.) as delimiter automatically without user input (no annoying popups or options to fill in).

The same simple algorithm will accept almost any delimiter you want. You want commas like CSV? No problem. Or fields separated by tab (TSV)? Sure. How about * NIX files that use colons? We'll take it. Want to mix them up in the same table or file? Go ahead. These simple rules mean it's very easy for both humans and machines to encode and decode VSV files.

Since the rules are simple, consistent, and regular, VSV can be adopted for any purpose. Such as HTML lists and tables, media playlist, subtitle, real-time captioning, site summary syndication, configuration files, object and array notation, page markup, style sheets, notes, etc. The creator of VSV always writes notes and lists in VSV, and only uses the simple yet powerful VPL (VSV playlist) format in VLC media player (hundreds of .vpl files). VSV files take up much smaller space, to represent the same data compared to other formats, such as XML, JSON, RSS, XSPF, M3U, etc.

Moreover, VSV provides potentially greater functionality than other formats, due to versatility and extensibility for custom or vendor specified variables. For instance, VPL provides an easy way to load a list of files that only differ by incremental values (i.e. all episodes in all seasons of a show.) This would take up only simple three lines in VPL; whereas other formats would take dozens, if not hundreds of lines. That's because in other formats, each episode must be declared separately. Fortunately, VSV (thus VPL) are humane, dynamic formats that allow programs to interpret and execute the data as efficiently as possible.

** Exporting to VSV (creating files) **

A VSV file consists of two types of rows: header and data.

Rows are separated by newline.

** Creating Header Rows **

Header rows are optional.

A header row consists of one or more header field. Each header field is enclosed by any of these double matching bracket types:

```
[[]]
{{}}
(())
<<>>
```

A header row is identified when, ignoring the leading spaces of a row, the first two characters of a row are any consecutive double opening brackets, as listed above.

Distinct header fields may use the same or different brackets types. Different bracket types may be employed on the same header row and across rows.

When exporting to a VSV file, characters that are found in a header field must not be used as enclosing brackets for that field. Choose a bracket not found in that field to surround that field.

Any text in a header row that is not within the legal boundaries of a header field is ignored. That includes improper closing of brackets, and text outside the brackets. This side effect may be surreptitiously used as comments for your text file, but should be used with care, in order to be properly rendered by plugins. (That is, a plugin cannot safely interpret if your intent is a comment or an error, a typo.)

** Creating Data Rows **

Data rows (non headers) must be led by an explicit nonspace character, called delimiter. All leading spaces are ignored until a nonspace character is found, which becomes the delimiter for that row.

Values for a data row are placed between two delimiters. The first occurrence of a delimiter on that row is not counted as part of the values. To prevent delimiter-value collision, the delimiter should be a character that is not found in the values' texts of that row.

A null value has zero length, signified by consecutive delimiters with nothing in between them.

A delimiter at the end of the line after the final value is optional, unless the final value is a null value.

Each row may have its own distinct delimiter. A text file may have distinct rows with their own delimiters. Creators can use the same delimiters or mix them for different rows, as long as the desired values on that row are distinguishable (i.e. to prevent delimiter-value collision.)

When exporting to a VSV file, characters that are found in the values of a given row must not be used as delimiter for that row. Choose a character not found in that row's values as the delimiter for that row.

- Space and newline cannot be used as delimiter. Any other single character may be used.
- Letters and numbers may be used as delimiters, but are not recommended.
- Avoid using header field brackets as data row delimiters. Nevertheless, single bracket at beginning of a row should be read as a legal delimiter.
- Creators may have their own preferred delimiters. Common delimiters to use:
```
,
=
*
-
:
|
;
@
#
%
~
`
TAB
```

** Importing VSV (reading files) **

The following rules dictate how plugins and code should read and interpret VSV files.

Rows are separated by newline. Leading spaces on each row are discarded and ignored.

Ignoring the leading spaces of a row, if the first two characters of a row are identical opening brackets, this is a header row. Else it is a data row.

** Reading Header Rows **

Header fields must be enclosed by both an opening and a closing matching double brackets. Any other text on a header row is discarded and ignored.

** Reading Data Rows **

The first nonspace character of a data row is its delimiter. The values of this row are stored between two delimiters or the end of line. A value can have zero length, or null value. There is no value between a line-ending delimiter and end of line (it doesn't count as another value, not even null value).

In PHP, use the explode() function to store a row's values into an array split by the delimiter. For other languages, use a regexp to match the values separated by the delimiter.

** Install **

Perform the following based on your platform and needs.

- Get TablesPlus for Wordpress blogs and SMF forums.
-- WP : https://ieants.cc/code/plugins/wp-tablesplus.zip
-- SMF : https://ieants.cc/code/plugins/smf-tablesplus.zip
- For other websites with plain HTML, include the "vsv.js" script to re-render sections of the page that have one of the following classes:
    - vsv2list
    - vsv2table
    - vsv2von
    - vsv2vml
    - vsv2json
    - vsv2xml

** Examples **

* VSV in various styles and usages * see docs directory for samples
* Comparison to other text formats
* View index.html, or visit https://forrsiis.github.io/vsv/index.html
* Try out the TablesPlus plugins for Wordpress and SMF.

** FAQ **

* How to handle values that contain just newline?
    * Blank lines is recommended to be skipped over in the output.
* Can it be used for objects or hierarchical containers? i.e. in place of JSON, XML, HTML
    * The syntax of VSV is flexible, yet consistent and reliable enough as substitute for JSON and XML. Moreover, much easier to read and smaller file size than those behemoths.
* Can it be used as configuration file? cf. INI, CONF files, passwd
    * Yes, VSV can be used to replace simple configuration and database files.
* Can it be used for subtitles, playlists, site summary, etc?
    * Yes, VSV can be adapted for subtitles, playlists, and site summary syndication, and many other uses. Standards are in R&D phase. Playlists are already viable for VLC -- providing simple, yet powerful and elegant way to build playlists compared to other formats.

** Links **

* Showcase of lists, tables, object notation @ https://forrsiis.github.io/vsv/index.html
* Discussion about VSV, including expanding to various usages @  https://ieants.cc/smf/index.php?topic=203.0
