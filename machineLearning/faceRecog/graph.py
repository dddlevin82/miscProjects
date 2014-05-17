import matplotlib.pyplot as plt
f = open('lnData.txt')

lines = f.readlines()
falseNeg= []
falsePos = []
numDetects = []
for i in range(len(lines)):
	if not (i%3):
		falseNeg.append(float(lines[i].split()[0]))
	if not ((i-2)%3):
		numDetects.append(float(lines[i].split()[0]))
	if not ((i-1)%3):
		falsePos.append(float(lines[i].split()[0]))
print numDetects
print falsePos
print falseNeg


fig, ax1 = plt.subplots()
ax1.plot(numDetects, falsePos, label = 'False positive rate', color = 'b')
ax2 = ax1.twinx()
ax2.plot(numDetects, falseNeg, label = 'False negative rate', color = 'r')

ax1.set_ylabel('False positive rate', color = 'b')
ax2.set_ylabel('False negative rate', color = 'r')
ax1.set_xlabel('Weak learners in classifier')

plt.show()

