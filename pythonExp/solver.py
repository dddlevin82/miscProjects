import copy
import math
import numpy

class Equation:
	def __init__(self, eq):
		self.eq = eq
	def evalAt(self, varDict):
		return eval(self.eq, varDict)
	def derivative(self, varDict, var):
		val = self.evalAt(varDict)
		step = val/10000 + .0000001
		varDict = self.copyDict(varDict)
		varDict[var]-=step
		lowVal = self.evalAt(varDict)
		varDict[var]+=2*step
		highVal = self.evalAt(varDict)
		return (highVal-lowVal)/(2*step)
	def copyDict(self, varDict):
		newDict = {}
		for var in varDict:
			newDict[var] = varDict[var]
		return newDict
	
def solve(eqStrs, vars, guesses):
	#vars treated as global
	tolerance = .000001
	
	def getJacob(vals):
		jacob = []
		varDict = buildvarDict(vals)
		for eq in eqs:
			row = []
			for var in vars:
				row.append(eq.derivative(varDict, var))
			jacob.append(row)
		return jacob
	
	def getVector(vals):
		vector = []
		varDict = buildvarDict(vals)
		for eq in eqs:
			vector.append(-1.*eq.evalAt(varDict))
		return vector
	
	def takeStep(vals, steps):
		for valIdx in range(len(vals)):
			vals[valIdx] += steps[valIdx]
		return vals
	
	def getMaxError(vals):
		varDict = buildvarDict(vals)
		maxError = 0
		for eq in eqs:
			maxError = max(maxError, abs(eq.evalAt(varDict)))
		return maxError
	
	def initEqs(eqStrs):
		eqs = []
		for eqStr in eqStrs:
			eqs.append(Equation(eqStr))
		return eqs
		
	def solveZeros(eqs):
		solved = []
		for eq in eqs:
			equalIdx = eq.index('=')
			before = eq[:equalIdx]
			after = eq[equalIdx+1:len(eq)]
			solvedEq = after + '-(' + before + ')'
			solved.append(solvedEq)
		return solved
			
	def buildvarDict(vals):
		varDict = {'math':math}
		for varIdx in range(len(vars)):
			var = vars[varIdx]
			val = vals[varIdx]
			varDict[var] = val
		return varDict
	
	eqs = initEqs(solveZeros(eqStrs))
	error = getMaxError(guesses)
	vals = guesses
	converged = True
	numSteps = 0
	while error > tolerance:
		jacob = getJacob(vals)
		vector = getVector(vals)
		steps = numpy.linalg.solve(jacob, vector)
		vals = takeStep(vals, steps)
		error = getMaxError(vals)
		numSteps+=1
		if numSteps>10000:
			converged = False
			print "Failed to converge"
			break
	finalAns = buildvarDict(vals)
	del finalAns['math']
	return finalAns
	
print 'Greetings, human.'
print "Input as follows: solve(['eq1', 'eqn'], ['varName1', 'varNamen'], [guess1, guessn])"
#print solve(['x**2*z-3=0', '2*y*x - a=3', 'z*y=2', 'x*math.log(a+x)=5'],['x', 'y', 'z', 'a'],[1,1,2,3])