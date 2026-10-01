-- Produce plain text, safely escaped for HTML metadata attributes.
local function attribute(text)
  text = text:gsub("&", "&amp;"):gsub('"', "&quot;")
    :gsub("<", "&lt;"):gsub(">", "&gt;"):gsub("'", "&#39;")
  return pandoc.MetaInlines({pandoc.RawInline("html", text)})
end

local function plain(value)
  return pandoc.utils.stringify(value):gsub("[ \t\r\n\f\v]+", " "):match("^ *(.-) *$")
end

local function opening(paragraph)
  -- Some migrated posts retain old YAML fields at the start of their body.
  if not plain(paragraph):match("^title:") then return plain(paragraph) end

  local lines, line = {}, pandoc.List()
  for _, inline in ipairs(paragraph.content) do
    if inline.t == "SoftBreak" or inline.t == "LineBreak" then
      table.insert(lines, plain(line))
      line = pandoc.List()
    else
      line:insert(inline)
    end
  end
  table.insert(lines, plain(line))

  while #lines > 0 do
    local field = lines[1]:match("^(%a+):")
    if field == "title" or field == "date" or field == "comments"
      or field == "categories" or lines[1] == "---" or lines[1] == "—" then
      table.remove(lines, 1)
    else
      break
    end
  end
  return table.concat(lines, " "):gsub("^> *", "")
end

function Pandoc(doc)
  local title = plain(doc.meta.title or "Dan Bradbury")
  local description = plain(doc.meta.description or "")

  -- Explicit front matter descriptions take precedence over the opening paragraph.
  if description == "" then
    doc:walk({
      Para = function(paragraph)
        if description == "" then
          description = opening(paragraph)
        end
      end
    })
  end
  if description == "" then description = title end

  if pandoc.text.len(description) > 160 then
    description = pandoc.text.sub(description, 1, 157):gsub(" +$", "") .. "…"
  end

  doc.meta["og-title"] = attribute(title)
  doc.meta["og-description"] = attribute(description)
  return doc
end
