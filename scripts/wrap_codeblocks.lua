function CodeBlock(el)
  -- el.attr.classes contains language classes like {"python"} when fenced with ```{.python}
  local lang = nil
  local classes = (el.attr and el.attr.classes) or {}
  if #classes > 0 then lang = classes[1] end

  local attrs = {}
  if lang then attrs["data-lang"] = lang end

  return pandoc.Div({el}, pandoc.Attr("", {"code-block"}, attrs))
end
