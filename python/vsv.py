'''
= VSV = Versatile Separated Values

VSV is superset of comma separated values, tab separate values, and other SV.
VSV can use any character as delimiter, except space and newline.
VSV allows header fields, like those used in tables.
VSV can emulate other complex structures, like JSON, XML, playlists, subtitles, etc.
VSV is very simple to decode, encode, and manipulate.
Hence very easy to implement in any programming language, including
Python, Lua, Javascript, PHP, C/C++/C#, etc.

For more information on VSV, visit this URL:
http://shenafu.com/smf/index.php?topic=203.0

For source code in various languages, visit:
https://bitbucket.org/Shenafu/vsv/src/master/

VSV is Public Domain. It aspires to be an open standard.
No royalties are necessary to use or distribute VSV.

'''

import re
import io

class vsv:
	def __init__(self, s=None, file=False):
		'''
		`s` is the string message, or the file name, to be decoded.
		'''
		self.s = s

		'''
		`file` is True if decoding a file. Then `s` is the file name
		from which data will be read.
		'''
		self.file = file

		'''
		`contents` holds the data after being decodeed by self.decode(). It is a nested list, where each item is parsed
		from each line of the string or file. After contents is stored,
		users can manipulate at will.
		e.g. convert contents into json
		'''
		self.decode(file=file, save=True) # `save` is True will save to self.contents

	# regexp patterns to match header rows and fields
	fieldOpener = re.compile(r'^(\[\[|\(\(|\{\{|\<\<)')
	fieldBrackets = re.compile(r'[\{\(\[\<]{2}(.*?)[\}\)\]\>]{2}')

	def decode(self, s=None, file=False, save=False):
		if (s):
			self.s = s
		s = self.s

		# create IO buffer for string or file
		if (file):
			try:
				buf = open(s, 'rU')
			except:
				print("Cannot open file: {}".format(s))
				print('Error Reading VSV.')
				return
		else:
			try:
				buf = io.StringIO(unicode(s))
			except:
				print("Cannot read string.")
				print("Error Reading VSV.")
				return

		# parse each line from buffer
		lines = []
		try:
			for line in buf:
				line = unicode(line)
				line = line.strip(' ')
				line = line.strip('\n')
				if (len(line)):

					if (vsv.fieldOpener.match(line)):
						# is header row
						matches = vsv.fieldBrackets.findall(line)
						if (len(matches)):
							matches.insert(0, "header")
						else:
							matches = None
						#print(matches)
					else:
						# is data row
						delimiter = line[:1]
						line = line[1:]
						if (line[-1:]==delimiter):
							# disregard delimiter at end of line
							line = line[:-1]
						matches = line.rsplit(delimiter)
						if (len(matches)):
							matches.insert(0, "data")
						else:
							matches = None
						#print(matches)

					if (matches):
						lines.append(matches)

		except:
			print("Error decoding buffer.")
			print("Error Reading VSV.")
			return

		buf.close()

		if (save):
			self.contents = lines

		return lines
