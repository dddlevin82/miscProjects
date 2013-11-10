// matrixFun.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <vector>

using namespace std;

class Matrix {
public:
	vector<vector<double>> rows;
	Matrix(int nRow, int nCol);
	void populateDiagonal(int row, int col, double val); 
	void populateRow(int row, double val);
	void populateCol(int col, double val);
	void appendCol(Matrix &col);
	Matrix sliceCol(int col);
	Matrix sliceRow(int row);
	Matrix sliceRows(int min, int max); //up to but not including b
	Matrix sliceBlock(int row, int col, int numRows, int numCols);
	vector<Matrix> asRowBlocks(int numBlocks);
	Matrix operator + (Matrix &m);
	Matrix operator - (Matrix &m);
	Matrix operator * (Matrix &m);
};

Matrix Matrix::operator+ (Matrix &m) {
	Matrix res = Matrix(rows.size(), rows[0].size());
	for (int y=0; y<rows.size(); y++) {
		for (int x=0; x<rows[0].size();  x++) {
			res.rows[y][x] = rows[y][x] + m.rows[y][x];
		}
	}
	return res;
}

Matrix Matrix::operator- (Matrix &m) {
	Matrix res = Matrix(rows.size(), rows[0].size());
	for (int y=0; y<rows.size(); y++) {
		for (int x=0; x<rows[0].size();  x++) {
			res.rows[y][x] = rows[y][x] - m.rows[y][x];
		}
	}
	return res;
}

Matrix Matrix::operator* (Matrix &m) {
	Matrix res = Matrix(rows.size(), m.rows[0].size());

	for (int y=0; y<res.rows.size(); y++) {
		for (int x=0; x<res.rows[0].size(); x++) {
			double sum = 0;
			for (int my=0; my<m.rows.size(); my++) {
				sum += m.rows[my][x] * rows[y][my];
			}
			res.rows[y][x] = sum;
		}
	}
	return res;
	
}

Matrix::Matrix(int nRow, int nCol) {
	
	for (int y=0; y<nRow; y++) {
		vector<double> row;
		row.reserve(nCol);
		for (int x=0; x<nCol; x++) {
			row.push_back(0);
		}
		rows.push_back(row);
	}

}

Matrix Matrix::sliceCol(int nCol) {
	Matrix destCol = Matrix(rows.size(), 1);
	for (int y=0; y<rows.size(); y++) {
		destCol.rows[y][0] = rows[y][nCol];
	}
	return destCol;
}

Matrix Matrix::sliceRow(int nRow) {
	Matrix destRow = Matrix(1, rows[0].size());
	destRow.rows[0] = rows[nRow];
	return destRow;
}

Matrix Matrix::sliceRows(int min, int max) {
	Matrix sliced = Matrix(max - min, rows[0].size());
	for (int i=min; i<max; i++) {
		sliced.rows[i - min] = rows[i];
	}
	return sliced;
}

Matrix Matrix::sliceBlock(int row, int col, int nRows, int nCols) {
	Matrix block = Matrix(nRows, nCols);
	for (int y=0; y<nRows; y++) {
		for (int x=0; x<nCols; x++) {
			block.rows[y][x] = rows[row + y][col + x];
		}
	}
	return block;
}

void Matrix::populateRow(int nRow, double val) {
	for (int x=0; x<rows[0].size(); x++) {
		rows[nRow][x] = val;
	}
}

void Matrix::appendCol(Matrix &col) {
	for (int y=0; y<rows.size(); y++) {
		rows[y].push_back(col.rows[y][0]);
	}
}

void Matrix::populateCol(int nCol, double val) {
	for (int y=0; y<rows.size(); y++) {
		rows[y][nCol] = val;
	}
}

void Matrix::populateDiagonal(int row, int col, double val) {
	int y = row;
	int x = col;
	while (y < rows.size() && x < rows[0].size()) {
		rows[y][x] = val;
		y++;
		x++;
	}
}

class SplitMatrix {
public:
	SplitMatrix(Matrix &top, Matrix &bottom);
	Matrix top;
	Matrix bottom;
};

SplitMatrix::SplitMatrix(Matrix &top_, Matrix &bottom_) : top(top_), bottom(bottom_) {
	this->top = top;
	this->bottom = bottom;
}

Matrix forwardSubCol(Matrix &coefs, Matrix &eqls) {
	Matrix xs = Matrix(eqls.rows.size(), 1);
	for (int y=0; y<coefs.rows.size(); y++) {
		double sum = 0;
		for (int x=0; x<y; x++) {
			sum += coefs.rows[y][x] * xs.rows[x][0];

		}
		xs.rows[y][0] = eqls.rows[y][0] -sum / coefs.rows[y][y];
	}
	return xs;
}


Matrix forwardSub(Matrix &coefs, Matrix &eqls) {
	Matrix xs = Matrix(coefs.rows.size(), 0);
	for (int x=0; x<eqls.rows[0].size(); x++) {
		Matrix eqlsCol = eqls.sliceCol(x);
		Matrix xsCol = forwardSubCol(coefs, eqlsCol);
		xs.appendCol(xsCol);
	}
	return xs;

}

vector<Matrix> Matrix::asRowBlocks(int blockSize) {
	vector<Matrix> blocks;
	for (int i=0; i< (int)rows.size() / blockSize; i++) {
		Matrix cpRows = Matrix(blockSize, rows[0].size());
		for (int j=0; j<blockSize; j++) {
			cpRows.rows[j] = rows[i * blockSize + j];
		}
		blocks.push_back(cpRows);
	}
	return blocks;

}

vector<Matrix> sliceLs(Matrix coefs, int blockSize) {
	vector<Matrix> ls;
	for (int i=0; i<(int)coefs.rows.size() / blockSize; i++) {
		ls.push_back(coefs.sliceBlock(i * blockSize, i * blockSize, blockSize, blockSize));
	}
	return ls;
}

vector<Matrix> sliceRs(Matrix coefs, int blockSize) {
	vector<Matrix> rs;
	for (int i=1; i<(int)coefs.rows.size() / blockSize; i++) {
		rs.push_back(coefs.sliceBlock(i * blockSize, (i - 1) * blockSize, blockSize, blockSize));
	}
	return rs;
}

vector<Matrix> calcGs(vector<Matrix> &rs, vector<Matrix> &ls) {
	vector<Matrix> gs;
	for (int i=0; i<rs.size(); i++) {
		gs.push_back(forwardSub(ls[i+1], rs[1]));
	}
	return gs;

}

vector<Matrix> calcBis(vector<Matrix> &ls, vector<Matrix> &ansBlocks) {
	vector<Matrix> bis;
	for (int i=0; i<ls.size(); i++) {
		bis.push_back(forwardSub(ls[i], ansBlocks[i]));
	}
	return bis;
}

vector<Matrix> makeGHats(vector<Matrix> &gs, int blockSize, int bandwidth) {
	vector<Matrix> gHats;
	int firstZero = blockSize - bandwidth;
	for (int i=0; i<gs.size(); i++) {
		Matrix gHat = Matrix(blockSize, bandwidth);
		for (int y=0; y<blockSize; y++) {
			for (int x=0; x<bandwidth; x++) {
				gHat.rows[y][x] = gs[i].rows[y][firstZero + x];
			}

		}
		gHats.push_back(gHat);
	}
	return gHats;
}

vector<SplitMatrix> splitByBand(vector<Matrix> &mtx, int blockSize, int bandwidth) {
	vector<SplitMatrix> split;
	for (int i=0; i<mtx.size(); i++) {
		split.push_back(SplitMatrix(mtx[i].sliceRows(0, blockSize - bandwidth), mtx[i].sliceRows(blockSize - bandwidth, blockSize))); 
	}
	return split;
}

vector<Matrix> solveZs(vector<SplitMatrix> &UVs, vector<SplitMatrix> &MHs) {
	vector<Matrix> zs;
	zs.push_back(UVs[0].bottom);
	for (int i=1; i<UVs.size(); i++) {
		zs.push_back(UVs[i].bottom - MHs[i-1].bottom * zs[i-1]);
	}
	return zs;
}

vector<Matrix> solveYs(vector<SplitMatrix> &UVs, vector<SplitMatrix> &MHs, vector<Matrix> &zs) {
	vector<Matrix> ys;
	ys.push_back(UVs[0].top);
	for (int i=1; i<UVs.size(); i++) {
		ys.push_back(UVs[i].top - MHs[i-1].top * zs[i-1]);
	}
	return ys;
}

Matrix solveXs(vector<Matrix> &ls, vector<Matrix> &bis, vector<Matrix> &ans, vector<Matrix> &gs, int bandwidth) {
	int blockSize = ls[0].rows.size();
	vector<Matrix> gHats = makeGHats(gs, blockSize, bandwidth);
	vector<SplitMatrix> MHs = splitByBand(gHats, blockSize, bandwidth);
	vector<SplitMatrix> UVs = splitByBand(bis, blockSize, bandwidth);
	vector<Matrix> zs = solveZs(UVs, MHs);
	vector<Matrix> ys = solveYs(UVs, MHs, zs);
	Matrix xs = Matrix(zs.size() * zs[0].rows.size() + ys.size() * ys[0].rows.size(), 1);
	int index = 0;
	for (int i=0; i<zs.size(); i++) {
		Matrix *yGroup = &ys[i];
		Matrix *zGroup = &zs[i];

		for (int row=0; row<yGroup->rows.size(); row++) {
			xs.rows[index][0] = yGroup->rows[row][0];
			index++;
		}
		for (int row=0; row<zGroup->rows.size(); row++) {
			xs.rows[index][0] = zGroup->rows[row][0];
			index++;
		}
	}
	return xs;
}

int _tmain(int argc, _TCHAR* argv[])
{
	int numProc = 4;
	int blockSize = 5;
	int mtxSize = numProc * blockSize;
	Matrix coefs = Matrix(mtxSize, mtxSize);
	coefs.populateDiagonal(0, 0, 1);
	coefs.populateDiagonal(1, 0, -1);
	//coefs.populateDiagonal(2, 0, -2);
	vector<Matrix> rs = sliceRs(coefs, blockSize);
	vector<Matrix> ls = sliceLs(coefs, blockSize);
	vector<Matrix> gs = calcGs(rs, ls);
	int bandwidth = 2;
	Matrix ans = Matrix(mtxSize, 1);
	ans.populateCol(0, 1);
	vector<Matrix> ansBlocks = ans.asRowBlocks(blockSize);
	vector<Matrix> bis = calcBis(ls, ansBlocks);
	Matrix xs = solveXs(ls, bis, ansBlocks, gs, bandwidth);
	return 0;
}

