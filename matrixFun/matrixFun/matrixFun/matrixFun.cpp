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
	void appendCol(Matrix col);
	Matrix sliceCol(int col);
	Matrix sliceRow(int row);
};

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


void Matrix::populateRow(int nRow, double val) {
	for (int x=0; x<rows[0].size(); x++) {
		rows[nRow][x] = val;
	}
}

void Matrix::appendCol(Matrix col) {
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

Matrix forwardSubCol(Matrix coefs, Matrix eqls) {
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


Matrix forwardSub(Matrix coefs, Matrix eqls) {
	Matrix xs = Matrix(coefs.rows.size(), 0);
	for (int x=0; x<eqls.rows[0].size(); x++) {
		Matrix eqlsCol = eqls.sliceCol(x);
		Matrix xsCol = forwardSubCol(coefs, eqlsCol);
		xs.appendCol(xsCol);
	}
	return xs;

}




int _tmain(int argc, _TCHAR* argv[])
{
	int numProc = 4;
	int blockSize = 5;
	int mtxSize = 2;//numProc * blockSize;
	Matrix coefs = Matrix(mtxSize, mtxSize);
	coefs.populateDiagonal(0, 0, 1);
	coefs.populateDiagonal(1, 0, -1);
	Matrix ans = Matrix(2, 2);
	ans.populateDiagonal(0, 1, -1);
	Matrix xs = forwardSub(coefs, ans);
	return 0;
}

