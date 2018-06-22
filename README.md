# VSV

** Versatile Separated Values (VSV) **

Proposal: A versatile, efficient, unambiguous, standardized, simple text format for creating tables and lists that's easily read and created by both humans and machines, that supports many variations for any personal style, preferences, and protocols. Can accept any nonspace character (including comma, colon, tab, asterisk, etc.) as delimiter automatically without user input (no annoying popups or options to fill in).

The same simple algorithm will accept almost any delimiter you want. You want commas like CSV? No problem. Or fields separated by tab (TSV)? Sure. How about *NIX files that use colons? We'll take it. Want to mix them up in the same table or file? Go ahead.

** Exporting to VSV (creating files) **

A VSV file consists of two types of rows: header and data.

Rows are separated by newline.

** Creating Header Rows **

Header rows are optional. Each header field is enclosed by any of these double matching bracket types:
Code: [Select]
[[]]
{{}}
(())
<<>>

Different header fields may use different brackets types. Mixed bracket types may be employed on the same header row.

When exporting to a VSV file, characters that are found in a header field must not be used as enclosing brackets for that field. Choose a bracket not found in that field to surround that field.

Any text in a header row that is not within the legal boundaries of a header field is ignored. That includes improper closing of brackets, and text outside the brackets. This side effect may be surreptitiously used as comments for your text file, but should be used with care, in order to be properly rendered by plugins. (That is, a plugin cannot safely interpret if your intent is a comment or an error, a typo.)

** Creating Data Rows **

Data rows (non headers) must be led by an explicit nonspace character, called delimiter. Values for that row are placed between two delimiters. The first occurrence of a delimiter on that row is not counted as part of the values.

A null value has zero length, signified by consecutive delimiters with nothing in between them.

A delimiter at the end of the line after the final value is optional, unless the final value is a null value.

Each row may have its own distinct delimiter. A text file may have different rows with various delimiters. Creators can use the same delimiters or mix them for different rows, as long as the desired values on that row are distinguishable (i.e. to prevent delimiter collision.)

When exporting to a VSV file, characters that are found in the values of a given row must not be used as delimiter for that row. Choose a character not found in that row's values as the delimiter for that row.
Space and newline cannot be used as delimiter. Any other single character may be used.
Letters and numbers may be used as delimiters, but are not recommended.
Avoid using header field brackets as data row delimiters. Nevertheless, single bracket at beginning of a row should be read as a legal delimiter.
Creators may have their own preferred delimiters. Common delimiters to use:

,
:
|
;
*
-
@
#
%
~
TAB


** Importing VSV (reading files) **

The following rules dictate how plugins and code should read and interpret VSV files.

Rows are separated by newline. Leading spaces on each row are discarded and ignored.

If the first two nonspace characters of a row are identical opening brackets, this is a header row. Else it is a data row.

** Reading Header Rows **

Header fields must be enclosed by both an opening and a closing matching double brackets. Any other text on a header row is discarded and ignored.

** Reading Data Rows **

The first nonspace character of a data row is its delimiter. The values of this row are stored between two delimiters or the end of line. A value can have zero length, or null value. There is no value between a line-ending delimiter and end of line (it doesn't count as another value, not even null value).

In PHP, use the explode() function to store a row's values into an array split by the delimiter. For other languages, use a regexp to match the values separated by the delimiter.

** Install **

Perform the following based on your platform and needs.

- Get TablesPlus for SMF forums and Wordpress blogs.
- For other websites with plain HTML, include the "vsv.js" script to re-render sections of the page that have the class "vsv" into a HTML table.

** Examples **

* VSV in various styles and situations
* Comparison to other text formats

** Questions **

* How to handle values that contain newline?
* Can it be used for objects or hierarchy? i.e. in place of JSON, XML, HTML
* Can it be used as configuration file? cf. INI, CONF files
