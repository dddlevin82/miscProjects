import sys
src = open(sys.argv[1], 'r')
dest = open(sys.argv[2], 'w')

def getFileName(line):
	path = ''
	identIdx = 0
	
	if 'href' in line:
		identIdx = line.index('href')
	elif 'src' in line:
		identIdx = line.index('src')
		
	path = line[identIdx:]
	if "'" in path:
		identIdx = line.index("'")
	elif '"' in path:
		identIdx = line.index('"')
	path = path[identIdx+1:]
	if "'" in path:
		identIdx = line.index("'")
	elif '"' in path:
		identIdx = line.index('"')	
	path = path[0:identIdx]
	print 'Path ' + path
	return path

def writeFile(fileName):
	f = open(fileName, 'r')
	for line in f:
		dest.write(line)

	
for line in src:
	print 'line ' + line
	if '<script src' in line or '<link type' in line:
		fileName = getFileName(line)
		writeFile(fileName)
	else:
		dest.write(line)