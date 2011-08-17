#!/usr/bin/env ruby

require "readline"

version     = Readline.readline("Input next version of this addon: ", true)
max_version = Readline.readline("Input next max version for target application: ", true)

replace_info = {
  "install.rdf" => {
    /(<em:version>)(.*?)(<\/em:version>)/       => version,
    /(<em:maxVersion>)(.*?)(<\/em:maxVersion>)/ => max_version,
  },
  "update.rdf"  => {
    /(updateinfo\/)(.*?)(\.xhtml)/ => version,
    /(em:version=")(.*?)(")/       => version,
    /(em:maxVersion=")(.*?)(")/    => max_version
  },
}

replace_info.each { |file_name, pairs|
  content = open(file_name) { |file| file.read }
  pairs.each { |pattern, replacer| content.gsub!(pattern, "\\1#{replacer}\\3") }
  open(file_name, "w") { |file| file.write(content) }
}
