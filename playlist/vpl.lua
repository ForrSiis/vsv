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
VSV.temp.vars = {} -- store custom variables
VSV.vplExtension = "%.vpl"
VSV.fieldOpener = "^([%[%({<])%1";
VSV.fieldBrackets = "(([%[%({<])%2(.-)([%]%)}>])%4)"
VSV.varPattern = "^:(.-)$"

---------------------------

 -- short codes to replace text inside data
VSV.replace = {
	f = function () return VSV.temp.currFile and VSV.temp.currFile.path or "" end,
	s = function () return VSV.temp.currFile and VSV.temp.currFile.subtitle or "" end,
	t = function () return VSV.temp.currFile and VSV.temp.currFile.title or "" end,
	a = function() return VSV.temp.currFile and VSV.temp.currFile.artist or "" end,
	p = function() return VSV.temp.currFile and VSV.temp.currFile.publisher or "" end,
	d = function() return VSV.temp.currFile and VSV.temp.currFile.duration or "" end,
	id = function() return VSV.temp.currFile and VSV.temp.currFile.id or "" end,
	desc = function() return VSV.temp.currFile and VSV.temp.currFile.description or "" end,
	comment = function() return VSV.temp.currFile and VSV.temp.currFile.comment or "" end,

	tAll = function () return VSV.temp.titleAll or "" end,
	aAll = function() return VSV.temp.artistAll or "" end,
	pAll = function() return VSV.temp.publisherAll or "" end,
	dAll = function() return VSV.temp.durationAll or "" end,
	descAll = function() return VSV.temp.descriptionAll or "" end,
	commentAll = function() return VSV.temp.commentAll or "" end,
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

	-- sort items by id
	table.sort(mediaList, VSV.sortById)

	-- startPlayId given id
	if VSV.temp.startPlayId then
		mediaList = VSV.startPlayAt(mediaList, {"id", VSV.temp.startPlayId})
	elseif VSV.temp.startPlayFile then
		mediaList = VSV.startPlayAt(mediaList, {"file", VSV.temp.startPlayFile})
	end

	return mediaList
end

---------------------------------------

--[[Lua Language Utility Functions]]

function escapeRegex(re)
	
	local ret = re
	local pattern = "([%-])"
	local replacement = "%%%1"
	
	vlc.msg.dbg("ret before: "..ret)
	
	ret = string.gsub(ret, pattern, replacement)
	
	vlc.msg.dbg("ret after: "..ret)

	return ret
end

---------------------------------------

function VSV.startPlayAt (list, start)
	local s, t = {}, {} -- temp hold moved items
	local matched = false

	for k,v in pairs(list) do
		if ( not matched and ((start[1] == "id" and v.id == start[2]) or (start[1] == "file" and string.find(v.path, escapeRegex(start[2]))))) then
			vlc.msg.dbg("start found: ".. table.concat(start, ","))
			matched = true
			vlc.msg.dbg("startPlayAt found: "..v.path)
		end

		if (matched) then
			table.insert(s, v)
		else
			table.insert(t, v)
		end
	end

	-- merge tables
	for k,v in pairs(t) do
		table.insert(s, v)
	end

	return s, true
end

function VSV.sortById (a, b)
	return a.id < b.id
end

function VSV.mapTo.pl (vsv)
	vsv = VSV.mapTo.array(vsv);
	local pl = {}
	VSV.temp.id = 0

	-- parse vsv rows
	VSV.section = "main"

	for index, row in ipairs(vsv) do
		rowType = table.remove(row, 1)
		if (rowType == "header") then
			VSV.section = row[1]
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
	local data = fields
	if (data) then
		if type(data) == "table" then
			local filename = ""
			if VSV.temp.affix then
				for i, a in ipairs(VSV.temp.affix) do
					filename = filename .. a
					if data[i] then
						filename = filename .. data[i]
					end
				end
			else	
				filename = table.concat(data);
			end
			data = filename
		end
		
		local file = {}

		VSV.temp.currFile = file
		VSV.temp.file = data
		VSV.temp.id = VSV.temp.id + 1

		file.path = data
		file.id = VSV.temp.id
		file.title = VSV.parse.replace(VSV.temp.titleAll)
		file.artist = VSV.parse.replace(VSV.temp.artistAll)
		file.publisher = VSV.parse.replace(VSV.temp.publisherAll)
		file.description = VSV.parse.replace(VSV.temp.descriptionAll)
		file.comment = VSV.parse.replace(VSV.temp.commentAll)

		table.insert(pl, file)

		vlc.msg.dbg("file found: ", data)
	end
end

---------------------------

function VSV.dataProp.fn (fields, pl)
	--[[
		fn is for sequential numbering in file names
		1st field = starting number in sequence
		2nd field = ending number in sequence
		if 1st field omitted, starting number set to 1
		if 2nd field omitted, end number set to starting number
		1st field should be less than or equal to 2nd field
		if 2nd field less than 1st field, ending = starting number
		if you need to pad numbers with leading 0s, use 'pad' property before 'fn'
		
		repeat for every sequential pair (3,4), (5,6), etc.
	--]]
	
	vlc.msg.dbg("fn found: "..table.concat(fields, ","))

	local min, max, parts, pad = {}, {}, {}, VSV.temp.pad or {}
	local x = 1
	for i=1, #fields, 2 do
	vlc.msg.dbg("i: " .. i)
		min[x] = (tonumber(fields[i]) and tonumber(fields[i])) or 1
		max[x] = (fields[i+1] and tonumber(fields[i+1]) and tonumber(fields[i+1])) or min[x]
		x = x + 1
	end
	vlc.msg.dbg("min: " .. table.concat(min, ","))
	vlc.msg.dbg("max: " .. table.concat(max, ","))
	for i in ipairs(min) do
		if not pad[i] then
			pad[i] = 1
		end
		parts[i] = min[i]
	end
	local totalFiles = 1
	for i in ipairs(max) do
		totalFiles = totalFiles * (max[i] - min[i] + 1)
	end
	vlc.msg.dbg("totalFiles: " .. totalFiles)
	vlc.msg.dbg("parts: " .. table.concat(parts, ","))
	for n=1, totalFiles do
		local file = ""
		for i, a in ipairs(VSV.temp.affix) do
			file = file .. a
			if pad[i] then
				file = file .. string.format("%0"..pad[i].."d", parts[i])
			end
		end
		parts[#parts] = parts[#parts] + 1
		for i=#parts, 1, -1 do			
			if parts[i] > max[i] then
				parts[i] = min[i]
				if parts[i-1] then
					parts[i-1] = parts[i-1] + 1
				end
			end
		end
		vlc.msg.dbg("fn file: " .. file)
		VSV.dataProp.f (file, pl)
	end
end

---------------------------

function VSV.dataProp.pad (fields, pl)
	-- pad numbers with 0s for fn property
	
	VSV.temp.pad = {}
	for i in ipairs(fields) do
		VSV.temp.pad[i] = tonumber(fields[i]) or 1
	end

	vlc.msg.dbg("pad found: "..table.concat(VSV.temp.pad, ","))
end

---------------------------

function VSV.dataProp.id (fields, pl)
	-- id is for id, or playlist order

	local data = fields[1]
	if (data) then
		data = tonumber(data)
		local file = VSV.temp.currFile
		VSV.temp.id, file.id = data, data

		vlc.msg.dbg("id found: ", data)
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

function VSV.dataProp.var (fields, pl)
	-- var is for custom variables

	local var, value = fields[1], { unpack(fields, 2) }
	VSV.temp.vars[var] = value

	vlc.msg.dbg("variable found: ", var, unpack(value))
end

---------------------------

function VSV.dataProp.tAll (fields, pl)
	-- tAll is for title for subsequent files

	local data = table.concat(fields, " - ")

	vlc.msg.dbg("tAll found: ", data)

	data = VSV.parse.replace(data)
	VSV.temp.titleAll = data
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

function VSV.dataProp.pathAll (fields, pl)
	-- pathAll is affixed to file name for subsequent files

	VSV.temp.affix = #fields > 0 and fields or nil

	vlc.msg.dbg("pathAll found: affix: ".. (VSV.temp.affix and table.concat(VSV.temp.affix, ",") or 'nil'))
end

---------------------------

function VSV.dataProp.commentAll (fields, pl)
	-- commentAll is for comments for subsequent files

	local data = table.concat(fields, "\n")
	data = VSV.parse.replace(data)

	VSV.temp.commentAll = data

	vlc.msg.dbg("commentAll found: "..data)
end

---------------------------

function VSV.dataProp.startHere (fields, pl)
	-- startHere starts playing at current file
	VSV.temp.startPlayId = VSV.temp.id

	vlc.msg.dbg("startHere found: "..VSV.temp.startPlayId)
end

VSV.dataProp.startPlayHere = VSV.dataProp.startHere

---------------------------

function VSV.dataProp.startPlayId (fields, pl)
	-- startPlayId starts playing at given id

	local data = fields[1]
	VSV.temp.startPlayId = tonumber(data)

	vlc.msg.dbg("startPlayId found: "..data)
end

VSV.dataProp.startId = VSV.dataProp.startPlayId

---------------------------

function VSV.dataProp.startPlayFile (fields, pl)
	-- startPlayFile starts playing at matching file name

	local data = fields[1]
	VSV.temp.startPlayFile = data

	vlc.msg.dbg("startPlayFile found: "..data)
end

VSV.dataProp.startFile = VSV.dataProp.startPlayFile

---------------------------

function VSV.parse.replace (data, fieldType)
	-- replace or substitute special codes inside data text
	-- such as title, artist, description
	-- usually enclosed in double header brackets
	-- ex. `t`{{tAll}} - part 01

	if (not data) then return end

	vlc.msg.dbg("VSV.parse.replace CALLED")

	data = data:gsub(VSV.fieldBrackets,
		function(a,b,c,d)
	vlc.msg.dbg("VPL replace matches: ", a,b,c,d)
			-- a is entire matching string
			-- b is double opening brackets
			-- c is content between brackets
			-- d is double closing brackets

			local replacement = c

			if (string.find(c, VSV.varPattern)) then
				-- custom variable
				local var = string.match(c, VSV.varPattern)
				replacement = VSV.temp.vars[var] and VSV.parse.replace( table.concat(VSV.temp.vars[var], '\n'), fieldType) or ""
			elseif (VSV.replace[c]) then
				-- built-in properties
				replacement = VSV.replace[c]()
			end

	vlc.msg.dbg("VPL replacement: ", replacement)

			return replacement
		end
	)

	return data
end

---------------------------
