import matplotlib.pyplot as plt
xs = []
ys = []
xsb = []
ysb = []
lines = open('pos.dat').readlines()
'''
for l in lines:
	bits = [float(x) for x in l.split()]
	xs.append(bits[0])
	ys.append(bits[1])
	xsb.append(bits[2])
	ysb.append(bits[3])

plt.plot(xs, ys)
plt.plot(xsb, ysb)
'''
for l in lines:
	bits = [float(x) for x in l.split()]
	xs.append(bits[0])
plt.hist(xs, bins = 20)
plt.show()
