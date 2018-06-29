--[[
VPL = Versatile PlayList
Interpret VSV markup into play list

Public Domain - Open standard - No royalty
--]]

---------------------------

local VSV = {}
VSV.mapTo = {}
VSV.parse = {} -- additional parsing per row, e.g. substitute text
VSV.dataProp = {} -- data properties, like f for file
VSV.temp = {} -- store temporary data, like current file
VSV.vplExtension = "%.vpl"
VSV.fieldOpener = "^([%[%({<])%1";
VSV.fieldBrackets = "(([%[%({<])%2(.-)([%]%)}>])%4)"

---------------------------

 -- short codes to replace text inside data
VSV.replace = {
	f = function () return VSV.temp.currFile.path end,
	s = function () return VSV.temp.currFile.subtitle end,
	t = function () return VSV.temp.currFile.title end,
	a = function() return VSV.temp.currFile.artist end,
	p = function() return VSV.temp.currFile.publisher end,
	d = function() return VSV.temp.currFile.duration end,
	desc = function() return VSV.temp.currFile.description end,
	comment = function() return VSV.temp.currFile.comment end,

	tAll = function () return VSV.temp.titleAll end,
	aAll = function() return VSV.temp.artistAll end,
	pAll = function() return VSV.temp.publisherAll end,
	dAll = function() return VSV.temp.durationAll end,
	descAll = function() return VSV.temp.descriptionAll end,
	commentAll = function() return VSV.temp.commentAll end,
}

---------------------------

function descriptor()
	return {
		title = "Versatile PlayList",
		shortdesc = "Load VPL playlists",
		description = "VPL playlists are simple yet powerful playlist format derived from VSV Versatile Separated Values format",
		version = "0",
		author = "Xay Voong",
		capabilities = {"playing-listener", "meta-listener" },
	}
end

function activate()
	vlc.msg.dbg("VPL Parser Activated!!")
end

function deactivate()
	vlc.msg.dbg("VPL Parser Dectivated!!")
end

function close()
	vlc.msg.dbg("VPL Parser Closed!!")
end

function meta_changed()
	vlc.msg.dbg("VPL Parser Meta Changed!!")
end

function playing_changed()
	vlc.msg.dbg("VPL Parser Playing Changed!!")
	vlc.msg.dbg("[Dummy] Status: " .. vlc.playlist.status())
end

function probe()
	-- make sure the playlist file ends with acceptable extension

	local okay = string.match( vlc.path, VSV.vplExtension )

	return okay
end

function parse()
	-- read playlist file and send each item into VLC playlist

	-- store rows into array for processing as VSV
	local vsv = {}
	while true
	do
		line = vlc.readline()
		if not line then break end
		table.insert(vsv, line)
	end

	-- list of media files to be played
	mediaList = VSV.mapTo.pl(vsv)
	return mediaList
end

function VSV.mapTo.pl (vsv)
	vsv = VSV.mapTo.array(vsv);

	local pl = {}

	-- parse vsv rows
	local section = "main"

	for index, row in ipairs(vsv) do
		rowType = table.remove(row, 1)
		if (rowType == "header") then

		else
			prop = table.remove(row, 1)
			if ( prop and VSV.dataProp[prop] ) then
				VSV.dataProp[prop](row, pl)
			end
		end

	end

	return pl
end

function VSV.mapTo.array (vsv)
	-- convert text rows into array
	-- each array item is subarray of header or data items
	-- each subarray's 0th index is 'header' or 'data'

	vsvArray = {}

	for index, row in ipairs(vsv) do
		-- trim spaces only
		row = string.gsub(row, "^ +", "")
		row = string.gsub(row, " +$", "")

		if (string.len(row) ~= 0) then
			local matches = {}
			if (string.match(row, VSV.fieldOpener)) then
				-- is header row
				table.insert(matches, "header")
				row:gsub(VSV.fieldBrackets,
					function(header)
						table.insert(matches, header)
					end
				)
			else
				-- data row
				table.insert(matches, "data")
				local delimiter = string.sub(row,1,1)
				row = string.find(row, delimiter, -1) and string.sub(row, 2, -2) or string.sub(row, 2, -1)
				string.gsub(row, "([^%"..delimiter.."]*)%"..delimiter.."?",
					function(data)
						table.insert(matches, data)
					end
				)
				table.remove(matches)
			end

			table.insert(vsvArray, matches)
		end
	end

	return vsvArray
end

---------------------------

function VSV.dataProp.f (fields, pl)
	-- f is for file

	-- add file to playlist
	local data = fields[1]
	if (data) then
		local file = {}
		file.path = data
		file.title = VSV.temp.titleAll
		file.artist = VSV.temp.artistAll
		file.publisher = VSV.temp.publisherAll
		file.description = VSV.temp.descriptionAll
		file.comment = VSV.temp.commentAll

		table.insert(pl, file)

		VSV.temp.file = data
		VSV.temp.currFile = file

		vlc.msg.dbg("file found: ", data)
	end
end

---------------------------

function VSV.dataProp.s (fields, pl)
	-- s is for subtitle or lyric file

	-- add subtitle to current file
	local data = fields[1]
	if (data) then
		local file = VSV.temp.currFile

		file.options = file.options or {}
		table.insert(file.options, "sub-file="..data)
		--table.insert(file.options, "input-slave="..data)
		--table.insert(file.options, "no-sub-autodetect-file ")

		VSV.temp.subtitle = data

		vlc.msg.dbg("subtitle found: ", data)
		--vlc.msg.dbg("file.options: ", table.concat(file.options), ", ")
	end
end

---------------------------

function VSV.dataProp.d (fields, pl)
	-- d is for duration

	-- add title to current file
	for index, data in ipairs(fields) do
		if (data) then
			local file = VSV.temp.currFile

			file.duration = VSV.parse.replace(data)
			VSV.temp.duration = file.duration

			vlc.msg.dbg("duration found: ", data)
			break
		end
	end
end

---------------------------

function VSV.dataProp.t (fields, pl)
	-- t is for title

	-- add title to current file
	local data = table.concat(fields, " - ")
	data = VSV.parse.replace(data)
	local file = VSV.temp.currFile

	file.title = data
	file.name = data

	vlc.msg.dbg("title found: ", data)
end

---------------------------

function VSV.dataProp.a (fields, pl)
	-- a is for artist

	-- add artist to current file
	local data = table.concat(fields, " - ")
	data = VSV.parse.replace(data)
	local file = VSV.temp.currFile

	file.artist = data

	vlc.msg.dbg("artist found: ", data)
end

---------------------------

function VSV.dataProp.p (fields, pl)
	-- p is for publisher

	-- add publisher to current file
	local data = table.concat(fields, " - ")
	data = VSV.parse.replace(data)
	local file = VSV.temp.currFile

	file.publisher = data

	vlc.msg.dbg("publisher found: ", data)
end

---------------------------

function VSV.dataProp.desc (fields, pl)
	-- desc is for description

	-- add description to current file
	local data = table.concat(fields, "\n")
	data = VSV.parse.replace(data)
	local file = VSV.temp.currFile

	file.description = data

	vlc.msg.dbg("description found: ", data)
end

---------------------------

function VSV.dataProp.comment (fields, pl)
	-- comment is for comment

	-- add comment to current file
	local data = table.concat(fields, "\n")
	data = VSV.parse.replace(data)
	local file = VSV.temp.currFile

	file.comment = data

	vlc.msg.dbg("comment found: ", data)
end

---------------------------

function VSV.dataProp.tAll (fields, pl)
	-- tAll is for title for subsequent files

	local data = table.concat(fields, " - ")
	data = VSV.parse.replace(data)

	VSV.temp.titleAll = data

	vlc.msg.dbg("tAll found: ", data)
end

---------------------------

function VSV.dataProp.aAll (fields, pl)
	-- aAll is for artist for subsequent files

	local data = table.concat(fields, " - ")
	data = VSV.parse.replace(data)

	VSV.temp.artistAll = data

	vlc.msg.dbg("aAll found: ", data)
end

---------------------------

function VSV.dataProp.pAll (fields, pl)
	-- pAll is for publisher for subsequent files

	local data = table.concat(fields, " - ")
	data = VSV.parse.replace(data)

	VSV.temp.publisherAll = data

	vlc.msg.dbg("pAll found: ", data)
end

---------------------------

function VSV.dataProp.descAll (fields, pl)
	-- descAll is for description for subsequent files

	local data = table.concat(fields, "\n")
	data = VSV.parse.replace(data)

	VSV.temp.descriptionAll = data

	vlc.msg.dbg("descAll found: ", data)
end

---------------------------

function VSV.dataProp.commentAll (fields, pl)
	-- commentAll is for comments for subsequent files

	local data = table.concat(fields, "\n")
	data = VSV.parse.replace(data)

	VSV.temp.commentAll = data

	vlc.msg.dbg("commentAll found: ", data)
end

---------------------------

function VSV.parse.replace (data)
	-- replace or substitute special codes inside data text
	-- such as title, artist, description
	-- usually enclosed in double header brackets
	-- ex. `t`{{t}} - part 01

	vlc.msg.dbg("VSV.parse.replace CALLED")

	data = data:gsub(VSV.fieldBrackets,
		function(a,b,c,d)
	vlc.msg.dbg("VPL replace matches: ", a,b,c,d)
			local replacement = VSV.replace[c] and VSV.replace[c]() or ""

	vlc.msg.dbg("VPL replacement: ", replacement)

			return replacement
		end
	)

	return data
end

---------------------------
