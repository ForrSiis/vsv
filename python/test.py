#!/usr/bin/env python

from vsv import vsv

##################

filename = "names.vsv"
v = vsv(filename, file=True)
try:
	print('\n'.join(map(str, v.contents)))
except:
	pass
print('')

##################

s = """
((probably harder to read than JSON, but has similar capabilities
((however, JSON doesn't allow comments, like these first two lines
{{}}
 {{menu}}
  ~id~file
  ~value~File
  {{popup}}
   [[menuitem]]
    {{}}
     ~value~New
     ~onclick~CreateNewDoc()
    {{;}}
    {{}}
     ~value~Open
     ~onclick~OpenDoc()
    {{;}}
    {{}}
     ~value~Close
     ~onclick~CloseDoc()
    {{;}}
   [[;]]
  {{;}}
 {{;}}
{{;}}
"""
w = vsv(s)
try:
	print('\n'.join(map(str, w.contents)))
	pass
except:
	pass
print('')

##################

try:
	print('\n'.join(map(str, vsv().decode(s))))
	pass
except:
	pass
print('')

##################

try:
	print('\n'.join(map(str, vsv().decode("jsonlike.vsv", file=True))))
	pass
except:
	pass
print('')


##################

try:
	print('\n'.join(map(str, vsv().decode("kara.vsv", file=True))))
	pass
except:
	pass
print('')
