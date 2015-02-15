#!/usr/bin/env ruby

current_addon_version = File.read("./install.rdf").match(/(<em:version>)(.*?)(<\/em:version>)/)[2]

if ARGV.length != 1
  puts "Usage: #{__FILE__} ADDON_VERSION"
  puts "Current version #{current_addon_version}"
  exit
end

addon_version = ARGV[0]

replace_info = {
  "install.rdf" => {
    /(<em:version>)(.*?)(<\/em:version>)/ => addon_version
  },
  "update.rdf"  => {
    /(updateinfo\/)(.*?)(\.xhtml)/ => addon_version,
    /(em:version=")(.*?)(")/       => addon_version,
  },
}

replace_info.each { |file_name, pairs|
  content = open(file_name) { |file| file.read }
  pairs.each { |pattern, replacer| content.gsub!(pattern, "\\1#{replacer}\\3") }
  open(file_name, "w") { |file| file.write(content) }
}
