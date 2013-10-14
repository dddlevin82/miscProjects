import sys
import matplotlib.pyplot as plt
filePath = sys.argv[1]

def getPtData(file):
	xs = []
	ys = []
	for line in file:
		commaIdx = line.find(',')
		xs.append(float(line[0:commaIdx]))
		ys.append(float(line[commaIdx + 1:len(line)]))
	return {'xs': xs, 'ys': ys}
def graphData():
	print 'in graph'
	file = open(filePath, 'r')
	ptData = getPtData(file)
	plt.plot(ptData['xs'], ptData['ys'])
	plt.show()
	
graphData()