sum = 0
ao = 5.29e-11
def r(n, l):
	return ao * n * n * (1 + .5 * (1 - l*(l + 1)/(n*n)))

for l in range(100):
	sum += (2 * l + 1) * r(100, l)
	
denom = 0
for l in range(100):
	denom += 2 * l + 1

	
print sum / denom