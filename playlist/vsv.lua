--[[
VPL = Versatile PlayList
Interpret VSV markup into play list

Public Domain - Open standard - No royalty
--]]

---------------------------

local VSV = {}
VSV.mapTo = {}
VSV.dataProp = {} -- data properties, like f for file
VSV.temp = {} -- store temporary data, like current file
VSV.vplExtension = "%.vpl"
VSV.fieldOpener = "([%[%({<])%1";
VSV.fieldBrackets = "(([%[%({<])%2.-([%]%)}>])%3)"

---------------------------

function descriptor()
	return {
		title = "Versatile PlayList",
		shortdesc = "Load VPL playlists",
		description = "VPL playlists are simple yet powerful playlist format derived from VSV Versatile Separated Values format",
		version = "0",
		author = "Xay Voong",
		capabilities = { },
	}
end

function activate()
end

function deactivate()
end

function probe()
	-- make sure the playlist file ends with acceptable extension

	local okay = string.match( vlc.path, VSV.vplExtension )

	-- debug
	vlc.msg.dbg(okay, "VPL OKAY!!", "\n")

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
			vlc.msg.dbg("Is Header Row\n")

		else
			vlc.msg.dbg("Is Data Row\n")
			prop = table.remove(row, 1)
			if ( prop and VSV.dataProp[prop] ) then
				vlc.msg.dbg("Property found: ", prop)
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

	vlc.msg.dbg("\n", "Called VSV.mapTo.array", "\n")

	vsvArray = {}

	for index, row in ipairs(vsv) do
	vlc.msg.dbg("row: ", row, "\n")
		-- trim spaces only
		row = string.gsub(row, "^ +", "")
		row = string.gsub(row, " +$", "")

		if (string.len(row) ~= 0) then

			local matches = {}

			if (string.match(row, VSV.fieldOpener)) then
				-- is header row

				vlc.msg.dbg("header\n")

				table.insert(matches, "header")

				row:gsub(VSV.fieldBrackets,
					function(header)
						table.insert(matches, header)
					end
				)

				vlc.msg.dbg("matches\n")
				vlc.msg.dbg(table.concat(matches, "\t"))
				vlc.msg.dbg("\n\n")
			else
				-- data row

				vlc.msg.dbg("data\n")

				table.insert(matches, "data")

				local delimiter = string.sub(row,1,1)
				vlc.msg.dbg("delimiter\t", delimiter, "\t\n")
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

	-- debug start
	vlc.msg.dbg("\nvsvArray size: ")
	vlc.msg.dbg(table.getn(vsvArray))
	vlc.msg.dbg("\n")
	for key, row in ipairs(vsvArray) do
		if type(row)=="string" then
			vlc.msg.dbg(row, "\n")
		elseif type(row)=="table" then
			vlc.msg.dbg(table.concat(row, "\t"), "\n")
		end
	end
	-- debug end

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
		table.insert(pl, file)
		VSV.temp.currFile = file

		vlc.msg.dbg("file found: ", data)
		vlc.msg.dbg("vsvTempCurrFile: ", table.concat(VSV.temp.currFile, ", "))
	end
end

---------------------------

function VSV.dataProp.t (fields, pl)
	-- t is for title

	-- add title to current file
	local data = fields[1]
	if (data) then
		local file = VSV.temp.currFile
		file.title = data
		file.name = data

		vlc.msg.dbg("title found: ", data)
		vlc.msg.dbg("vsvTempCurrFile: ", table.concat(VSV.temp.currFile, ", "))
	end
end

---------------------------

function VSV.dataProp.a (fields, pl)
	-- a is for artist

	-- add title to current file
	local data = fields[1]
	if (data) then
		local file = VSV.temp.currFile
		file.artist = data

		vlc.msg.dbg("artist found: ", data)
		vlc.msg.dbg("vsvTempCurrFile: ", table.concat(VSV.temp.currFile, ", "))
	end
end

---------------------------

function VSV.dataProp.d (fields, pl)
	-- d is for duration

	-- add title to current file
	local data = fields[1]
	if (data) then
		local file = VSV.temp.currFile
		file.duration = data

		vlc.msg.dbg("duration found: ", data)
		vlc.msg.dbg("vsvTempCurrFile: ", table.concat(VSV.temp.currFile, ", "))
	end
end

---------------------------

function VSV.dataProp.desc (fields, pl)
	-- desc is for description

	-- add title to current file
	local data = fields[1]
	if (data) then
		local file = VSV.temp.currFile
		file.description = data

		vlc.msg.dbg("description found: ", data)
		vlc.msg.dbg("vsvTempCurrFile: ", table.concat(VSV.temp.currFile, ", "))
	end
end

---------------------------
